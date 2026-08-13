from pathlib import Path
from collections import Counter
from bs4 import BeautifulSoup

files = [
    Path('/home/ubuntu/upload/phieuhotro.html'),
    Path('/home/ubuntu/upload/trangchu-cs.html'),
    Path('/home/ubuntu/upload/cs-ticket.html'),
    Path('/home/ubuntu/upload/cs-dashboard.html'),
    Path('/home/ubuntu/upload/account-CS.html'),
]
required_form_ids = {
    'fName', 'fEmail', 'fPhone', 'fDate', 'chkCourse', 'fCourse',
    'courseBoxWrap', 'chipGrid', 'issueField', 'issueSelect', 'fTitle',
    'fDesc', 'fFile', 'fileDrop', 'fileName', 'errorText', 'submitBtn',
    'formView', 'successView', 'successText', 'againBtn', 'layoutContainer',
    'stubNum', 'stubName', 'stubCourse', 'stubCourseBody', 'stubTitle',
    'stubCat', 'stubDate'
}

for path in files:
    soup = BeautifulSoup(path.read_text(encoding='utf-8'), 'html.parser')
    ids = [node.get('id') for node in soup.find_all(attrs={'id': True})]
    duplicate_ids = sorted(key for key, count in Counter(ids).items() if count > 1)
    nested_anchors = bool(soup.select('a a'))
    active_items = soup.select('.sidebar .menu-item.active, .nav-sidebar .menu-item.active')
    print(f'{path.name}: ids={len(ids)}, active={len(active_items)}, nested_anchor={nested_anchors}')
    if duplicate_ids:
        raise SystemExit(f'Duplicate IDs in {path}: {duplicate_ids}')
    if nested_anchors:
        raise SystemExit(f'Nested anchors in {path}')
    if len(active_items) > 1:
        raise SystemExit(f'Multiple active menu items in {path}')

form_soup = BeautifulSoup(Path('/home/ubuntu/upload/phieuhotro.html').read_text(encoding='utf-8'), 'html.parser')
form_ids = {node.get('id') for node in form_soup.find_all(attrs={'id': True})}
missing = sorted(required_form_ids - form_ids)
if missing:
    raise SystemExit(f'Missing phieuhotro.js IDs: {missing}')

print('HTML structure, Sidebar active state and phieuhotro.js IDs OK')
