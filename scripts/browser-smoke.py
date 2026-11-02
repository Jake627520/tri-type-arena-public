import subprocess,time,json
from playwright.sync_api import sync_playwright
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=None
try:
 time.sleep(1)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1366,'height':900})
  errs=[]
  page.on('pageerror',lambda e:errs.append(str(e)))
  from pathlib import Path
  import base64
  root=ROOT
  html=(root/'index.html').read_text().replace('<script type="module" src="./src/app.mjs"></script>','')
  page.set_content(html)
  page.add_style_tag(content=(root/'src/style.css').read_text())
  legacy=(root/'src/legacy-lessons.mjs').read_text()
  pools=json.loads(legacy.split('export const LESSONS = ',1)[1].rstrip().removesuffix(';'))
  legacy_uri='data:text/javascript;base64,'+base64.b64encode(legacy.encode()).decode()
  engine=(root/'src/engine.mjs').read_text().replace("'./legacy-lessons.mjs'",repr(legacy_uri))
  uri='data:text/javascript;base64,'+base64.b64encode(engine.encode()).decode()
  script=(root/'src/app.mjs').read_text().replace("from './engine.mjs'",f"from '{uri}'")
  page.add_script_tag(type='module',content=script)
  page.wait_for_timeout(500)
  assert page.locator('#word').inner_text()==pools['en'][0]['display']
  page.get_by_role('button',name='简体拼音').click()
  assert page.locator('#word').inner_text()==pools['pinyin'][0]['display']
  page.locator('#start').click()
  page.locator('#typing').fill(pools['pinyin'][0]['answer'])
  assert page.locator('#words').inner_text()=='1'
  page.get_by_role('button',name='繁體注音').click()
  assert page.locator('#word').inner_text()==pools['zhuyin'][0]['display']
  page.locator('#start').click()
  keys=dict(zip('1qaz2wsxedcrfv5tgbyhnujm8ik,9ol.0p;/-6347','ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙㄧㄨㄩㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦˊˇˋ˙'))
  reverse={v:k for k,v in keys.items()}
  page.locator('#typing').fill(''.join(reverse[c] for c in pools['zhuyin'][0]['answer']))
  assert page.locator('#words').inner_text()=='1'
  page.screenshot(path=str(ROOT/'preview.png'),full_page=True)
  assert not errs,errs
  print('Browser smoke PASS: load, pinyin completion, zhuyin Daqian completion, no page errors')
  browser.close()
finally:
 if p is not None: p.terminate();p.wait()
