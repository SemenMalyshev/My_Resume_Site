/* Run with: node tests/site-check.cjs — no installed dependencies required. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const languageScript = fs.readFileSync(path.join(root, 'js/language.js'), 'utf8');

function checkLanguage({ page = 'ru', url = 'https://example.test/', saved, languages = ['ru-RU'], blocked = false, expected }) {
    let redirected;
    const context = {
        URL,
        window: { location: { href: url, replace: (target) => { redirected = target; } } },
        document: { documentElement: { lang: page }, addEventListener() {} },
        navigator: { languages, language: 'en-US' },
        localStorage: { getItem() { if (blocked) throw new Error('Storage blocked'); return saved; } }
    };
    vm.runInNewContext(languageScript, context);
    assert.equal(redirected, expected, JSON.stringify({ page, url, saved, languages, blocked }));
    assert.equal(context.window.portfolioText('opened', { file: 'MapState.cs' }), page === 'ru' ? 'Открыт файл MapState.cs' : 'Opened MapState.cs');
}

checkLanguage({ expected: undefined });
checkLanguage({ languages: ['en-US', 'ru'], expected: 'https://example.test/en.html' });
checkLanguage({ languages: ['fr-FR', 'ru-RU', 'en'], expected: undefined });
checkLanguage({ languages: ['fr', 'de'], expected: 'https://example.test/en.html' });
checkLanguage({ languages: [], expected: 'https://example.test/en.html' });
checkLanguage({ saved: 'ru', languages: ['en'], expected: undefined });
checkLanguage({ saved: 'en', expected: 'https://example.test/en.html' });
checkLanguage({ saved: 'invalid', expected: undefined });
checkLanguage({ url: 'https://example.test/?lang=ru', saved: 'en', languages: ['en'], expected: undefined });
checkLanguage({ url: 'https://example.test/?lang=en&ref=test#code', saved: 'ru', expected: 'https://example.test/en.html?lang=en&ref=test#code' });
checkLanguage({ page: 'en', url: 'https://example.test/en.html', saved: 'ru', expected: undefined });
checkLanguage({ page: 'en', url: 'https://example.test/en.html?lang=ru#projects', saved: 'en', expected: 'https://example.test/?lang=ru#projects' });
checkLanguage({ url: 'https://example.test/?lang=fr', saved: 'ru', languages: ['en'], expected: undefined });
checkLanguage({ blocked: true, languages: ['en'], expected: 'https://example.test/en.html' });
checkLanguage({ blocked: true, expected: undefined });

let russianIds;
for (const [file, locale] of [['index.html', 'ru'], ['en.html', 'en']]) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.match(html, new RegExp(`<html lang="${locale}"`));
    assert.equal([...html.matchAll(/<h1\b/g)].length, 1, `${file}: one main heading`);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
    if (russianIds) assert.deepEqual(ids, russianIds, 'Both locales expose the same sections and controls');
    else russianIds = ids;
    for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(target), `${file}: missing #${target}`);
    for (const [, resource] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
        if (/^(https?:|data:|mailto:|tel:)/.test(resource)) continue;
        const local = resource.split(/[?#]/)[0];
        assert.ok(fs.existsSync(path.resolve(root, local)), `${file}: missing ${local}`);
    }
    for (const [, image] of html.matchAll(/<img\b([^>]+)>/g)) assert.match(image, /\balt="[^"]+"/, `${file}: image needs alternative text`);
    for (const [, frame] of html.matchAll(/<iframe\b([^>]+)>/g)) assert.match(frame, /\btitle="[^"]+"/, `${file}: iframe needs a title`);
    assert.equal([...html.matchAll(/href="https:\/\/qrgames.fun\/games\/[1-5]"/g)].length, 5, `${file}: five actual game links`);
    assert.equal([...html.matchAll(/data-source="/g)].length, 8, `${file}: preserve all MapPinner source files`);
    assert.ok(!html.includes('20+') && !html.includes('3+'), `${file}: remove broad experience counters`);
    assert.ok(!html.includes('href="https://yandex.ru/games/"'), `${file}: remove generic platform card`);
    assert.match(html, /hreflang="ru"/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /data-language="ru"/);
    assert.match(html, /data-language="en"/);
    if (locale === 'en') {
        const content = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1>/g, '').replace(/aria-label="Русский"/g, '');
        assert.ok(!/[А-Яа-яЁё]/.test(content), 'English static content and accessible labels must be translated');
    } else {
        assert.ok(html.includes('Обучаю как новичков, так и опытных разработчиков базовым и продвинутым навыкам разработки'), 'Preserve the existing teaching-copy edit');
    }
}
console.log('Passed: language precedence, blocked storage, locale parity, links, assets, accessibility labels and approved content.');
