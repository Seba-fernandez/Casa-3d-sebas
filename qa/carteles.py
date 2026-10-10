# QA de carteles y mapa: npm run build && npm run preview (y npm run dev:api con CASA_MEMORY_DB=1), después: python3 qa/carteles.py
import os; os.makedirs("./qa-salida", exist_ok=True)
import time, sys, json
from playwright.sync_api import sync_playwright

OUT = './qa-salida/'  # capturas y resultados
URL = 'http://localhost:4173/?debug'
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

results = []
def check(name, ok, detail=''):
    results.append((name, bool(ok), detail))
    print(('PASS ' if ok else 'FAIL ') + name + (f'  [{detail}]' if detail else ''))

def state(page):
    return page.evaluate("""() => { const g = window.__casa.useGame.getState(); return {
      room: g.room, menu: g.menu, panel: g.panel && g.panel.type, dialog: !!g.dialog, scanner: g.scanner,
      started: g.started, url: location.href, hist: history.length, x: +window.__casa.player.x.toFixed(2) } }""")

def openers(page):
    return {
      'map': "() => window.__casa.useGame.getState().setMenu(true)",
      'panel': "() => window.__casa.useGame.getState().openPanel({type:'welcome'})",
      'dialog': "() => window.__casa.useGame.getState().say(['Linea uno del michi.', 'Linea dos.'], 'Michi')",
      'scanner': "() => window.__casa.useGame.getState().setScanner(true)",
    }

def is_open(s, kind):
    return {'map': s['menu'], 'panel': bool(s['panel']), 'dialog': s['dialog'], 'scanner': s['scanner']}[kind]

def mv(page):
    return page.evaluate("() => { const c = window.__casa; return { keys: c.input.keys.size, joy: Math.hypot(c.input.joy.x, c.input.joy.y) } }")

def back(page):
    page.evaluate("() => history.back()")
    time.sleep(0.6)

def start(page):
    page.goto(URL, wait_until='load'); time.sleep(3)
    page.get_by_role('button', name='Entrar').click(); time.sleep(3.5)

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)

    # ───────────── ESCRITORIO ─────────────
    page = b.new_page(viewport={'width': 960, 'height': 600})
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    start(page)
    base = state(page)
    O = openers(page)

    for kind in ['map', 'panel', 'scanner']:
        for how in ['Escape', 'KeyE', 'back', 'x']:
            if kind == 'scanner' and how == 'Backspace':
                continue
            page.evaluate(O[kind]); time.sleep(0.7)
            opened = is_open(state(page), kind)
            if how == 'back':
                back(page)
            elif how == 'x':
                sel = '.crt-close' if kind == 'scanner' else '.close'
                page.locator(sel).first.click(); time.sleep(0.6)
            else:
                page.keyboard.press(how); time.sleep(0.6)
            s = state(page)
            check(f'{kind}: se abre y se cierra con {how}', opened and not is_open(s, kind) and s['started'] and s['url'] == base['url'],
                  f"open={opened} after={is_open(s, kind)}")

    for kind in ['map', 'panel']:
        page.evaluate(O[kind]); time.sleep(0.6)
        page.keyboard.press('Backspace'); time.sleep(0.6)
        check(f'{kind}: se cierra con Retroceso', not is_open(state(page), kind))

    # mapa: la M abre y cierra
    page.keyboard.press('KeyM'); time.sleep(0.6)
    a = state(page)['menu']
    page.screenshot(path=OUT + 'qa-map-desktop.png')
    page.keyboard.press('KeyM'); time.sleep(0.6)
    check('mapa: M abre y M cierra', a and not state(page)['menu'])

    # diálogo: E avanza, atrás cierra
    page.evaluate(O['dialog']); time.sleep(0.6)
    page.keyboard.press('KeyE'); time.sleep(0.3)  # pasa a la línea 2 (la 1 ya terminó de escribirse)
    still = state(page)['dialog']
    line2 = 'dos' in page.locator('.dialog').inner_text()
    back(page)
    check('diálogo: E avanza el texto y atrás lo cierra', still and line2 and not state(page)['dialog'])

    # pila: diálogo abajo + panel arriba → atrás cierra SOLO el panel
    page.evaluate(O['dialog']); time.sleep(0.3)
    page.evaluate(O['panel']); time.sleep(0.5)
    back(page)
    s1 = state(page)
    back(page)
    s2 = state(page)
    check('pila: atrás cierra solo el cartel de arriba', (not s1['panel']) and s1['dialog'] and not s2['dialog'], f"{s1['panel']},{s1['dialog']} -> {s2['dialog']}")

    # pila con Esc y con E
    page.evaluate(O['dialog']); time.sleep(0.3)
    page.evaluate(O['panel']); time.sleep(0.5)
    page.keyboard.press('Escape'); time.sleep(0.4)
    s1 = state(page)
    check('pila: Esc cierra solo el de arriba', not s1['panel'] and s1['dialog'])
    page.keyboard.press('Escape'); time.sleep(0.4)

    # cerrar y reabrir rápido: atrás tiene que seguir cerrando el cartel
    page.evaluate(O['map']); time.sleep(0.4)
    page.keyboard.press('KeyE')
    page.keyboard.press('KeyM'); time.sleep(0.8)
    reopened = state(page)['menu']
    back(page)
    s = state(page)
    check('cerrar y reabrir rápido: atrás cierra (no sale del sitio)', reopened and not s['menu'] and s['started'] and s['url'] == base['url'])

    # escáner: código incorrecto → ALERTA → atrás la cierra y la casa te empuja
    page.evaluate("() => { const c = window.__casa; c.player.x = -3.7; c.player.z = 2.6 }"); time.sleep(0.5)
    page.evaluate(O['scanner']); time.sleep(0.8)
    for k in '0000':
        page.keyboard.press(k)
    page.keyboard.press('Enter'); time.sleep(2.5)
    alert = page.locator('.alert').count() == 1
    x0 = state(page)['x']
    back(page); time.sleep(2.0)
    s = state(page)
    check('alerta: atrás la cierra y te aleja de la puerta', alert and not s['scanner'] and s['x'] > x0, f'x {x0} -> {s["x"]}')

    # escáner: Retroceso borra dígitos (no cierra)
    page.evaluate(O['scanner']); time.sleep(0.8)
    page.keyboard.press('1'); page.keyboard.press('2'); page.keyboard.press('Backspace'); time.sleep(0.3)
    dots = page.locator('.crt-display').inner_text()
    check('escáner: Retroceso borra un dígito sin cerrar', state(page)['scanner'] and dots.count('●') == 1, dots)
    page.keyboard.press('Escape'); time.sleep(0.4)

    # formulario: escribir una E dentro de un campo no cierra el cartel
    page.evaluate("() => window.__casa.useGame.getState().setOwner(true)")
    page.evaluate("() => window.__casa.useGame.getState().openPanel({type:'console'})"); time.sleep(0.6)
    page.get_by_role('button', name='Agregar una skill').click(); time.sleep(0.3)
    page.get_by_label('¿Qué skill agregás?').type('React Three'); time.sleep(0.3)
    check('formulario: escribir E no cierra el cartel', state(page)['panel'] == 'console' and page.get_by_label('¿Qué skill agregás?').input_value() == 'React Three')
    page.keyboard.press('Escape'); time.sleep(0.4)
    page.evaluate("() => window.__casa.useGame.getState().setOwner(false)")

    # mapa: tocar una sala te lleva
    page.keyboard.press('KeyM'); time.sleep(0.7)
    page.locator('.map-room', has_text='Skills').click()
    for _ in range(40):
        time.sleep(0.25)
        if not page.evaluate("() => window.__casa.useGame.getState().transitioning") and state(page)['room'] == 'skills':
            break
    s = state(page)
    check('mapa: tocar Skills te lleva a Skills y cierra el mapa', s['room'] == 'skills' and not s['menu'])
    page.keyboard.press('KeyM'); time.sleep(0.7)
    page.screenshot(path=OUT + 'qa-map-desktop-skills.png')
    page.locator('.map-room', has_text='Baño').click(); time.sleep(0.6)
    s = state(page)
    check('mapa: el baño bloqueado no te deja pasar', s['room'] == 'skills' and s['menu'])
    page.keyboard.press('Escape'); time.sleep(0.4)

    # caminar no se traba: arrastrar la cámara no frena, un clic corto sí (aunque se haya perdido el keyup)
    page.keyboard.down('w'); time.sleep(0.5)
    page.mouse.move(600, 300); page.mouse.down(); page.mouse.move(700, 320, steps=6); page.mouse.up(); time.sleep(0.3)
    walking = mv(page)['keys'] == 1
    page.mouse.click(480, 200); time.sleep(0.3)  # W sigue "apretada" para el navegador: simula un keyup perdido
    check('caminar: arrastrar la cámara no frena, un clic sobre la escena sí', walking and mv(page)['keys'] == 0)
    page.keyboard.up('w')
    page.keyboard.down('d'); page.keyboard.down('Meta'); page.keyboard.up('Meta'); time.sleep(0.3)
    check('caminar: soltar Cmd/Ctrl/Alt suelta las teclas (el sistema se come el keyup)', mv(page)['keys'] == 0)
    page.keyboard.up('d')
    page.keyboard.down('a'); page.evaluate("() => window.dispatchEvent(new MouseEvent('contextmenu'))"); time.sleep(0.3)
    check('caminar: el menú del clic derecho suelta las teclas', mv(page)['keys'] == 0)
    page.keyboard.up('a')

    # atrás sin carteles abiertos: sale del sitio normalmente (no quedan entradas "trampa")
    page.evaluate("() => window.__casa.useGame.getState().setMenu(true)"); time.sleep(0.3)
    page.keyboard.press('Escape'); time.sleep(0.6)
    url_before = page.url
    try:
        page.go_back(wait_until='commit', timeout=30000)
    except Exception:
        pass
    time.sleep(0.8)
    check('sin carteles, atrás sale del sitio como siempre', page.url != url_before, page.url)
    check('escritorio: sin errores de JavaScript', not errs, '; '.join(errs[:3]))
    page.close()

    # ───────────── CELULAR ─────────────
    ctx = b.new_context(viewport={'width': 390, 'height': 800}, is_mobile=True, has_touch=True, device_scale_factor=2)
    m = ctx.new_page()
    merrs = []
    m.on('pageerror', lambda e: merrs.append(str(e)))
    start(m)
    O = openers(m)
    a_btn = m.locator('.action')

    def a_visible_and_on_top():
        box = a_btn.bounding_box()
        cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
        return m.evaluate(f"() => document.elementFromPoint({cx}, {cy})?.closest('.action') !== null")

    m.locator('.chip-btn', has_text='Mapa').tap(); time.sleep(0.8)
    lbl = a_btn.inner_text()
    on_top = a_visible_and_on_top()
    joy = m.locator('.joystick').count()
    m.screenshot(path=OUT + 'qa-map-mobile.png')
    a_btn.tap(); time.sleep(0.6)
    check('celu mapa: A se vuelve ✕, queda encima y cierra', lbl.strip() == '✕' and on_top and not state(m)['menu'], f'label={lbl!r} onTop={on_top}')
    check('celu: joystick se esconde con un cartel abierto', joy == 0)

    m.evaluate(O['panel']); time.sleep(0.7)
    on_top = a_visible_and_on_top()
    m.screenshot(path=OUT + 'qa-panel-mobile.png')
    a_btn.tap(); time.sleep(0.6)
    check('celu panel: A cierra el cartel', on_top and not state(m)['panel'])

    m.evaluate(O['scanner']); time.sleep(0.9)
    on_top = a_visible_and_on_top()
    m.screenshot(path=OUT + 'qa-scanner-mobile.png')
    a_btn.tap(); time.sleep(0.6)
    check('celu escáner: A cierra', on_top and not state(m)['scanner'])

    m.evaluate(O['dialog']); time.sleep(0.4)
    lbl = a_btn.inner_text()
    a_btn.tap(); time.sleep(0.3)
    a_btn.tap(); time.sleep(0.3)
    a_btn.tap(); time.sleep(0.3)
    a_btn.tap(); time.sleep(0.4)
    check('celu diálogo: A avanza y al final cierra', lbl.strip() == 'A' and not state(m)['dialog'])

    m.evaluate(O['panel']); time.sleep(0.6)
    back(m)
    s = state(m)
    check('celu: atrás del teléfono cierra el cartel y no sale', not s['panel'] and s['started'])
    check('celu: A vuelve a decir A sin carteles', a_btn.inner_text().strip() == 'A')
    # joystick inclinado + se abre un cartel: al cerrarlo el personaje NO sigue caminando solo
    box = m.locator('.joystick').bounding_box()
    cx, cy = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
    m.mouse.move(cx, cy); m.mouse.down(); m.mouse.move(cx, cy - 45, steps=4); time.sleep(0.4)
    held = mv(m)['joy'] > 0.5
    m.evaluate(O['dialog']); time.sleep(0.5)
    m.mouse.up(); time.sleep(0.2)
    m.evaluate("() => window.__casa.useGame.getState().closeDialog()"); time.sleep(0.6)
    check('celu: cerrar un cartel con el joystick inclinado no te deja caminando solo', held and mv(m)['joy'] == 0)

    check('celu: sin errores de JavaScript', not merrs, '; '.join(merrs[:3]))
    b.close()

passed = sum(1 for r in results if r[1])
print(f'\n{passed}/{len(results)} pruebas OK')
json.dump(results, open(OUT + 'qa-results.json', 'w'), ensure_ascii=False, indent=1)
