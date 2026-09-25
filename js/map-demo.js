const demoRoot = 'assets/demo/map-pinner/';
const buildRoot = `${demoRoot}Build/map-pinner`;
const assets = [
    `${buildRoot}.loader.js`,
    `${buildRoot}.framework.js.unityweb`,
    `${buildRoot}.wasm.unityweb`,
    `${buildRoot}.data.unityweb`,
];

const openButton = document.getElementById('open-map-demo');
const closeButton = document.getElementById('close-map-demo');
const dialog = document.getElementById('map-demo');
const canvas = document.getElementById('map-demo-canvas');
const status = document.getElementById('map-demo-status');

if (openButton && closeButton && dialog && canvas && status) {
    let loaderPromise;
    let loadingPromise;
    let unityInstance;
    let closing = Promise.resolve();
    const prefetchController = new AbortController();

    function loadScript() {
        if (!loaderPromise) {
            loaderPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = assets[0];
                script.onload = resolve;
                script.onerror = () => reject(new Error('Не удалось загрузить Unity WebGL.'));
                document.head.append(script);
            });
        }
        return loaderPromise;
    }

    async function startDemo() {
        await loadScript();
        return window.createUnityInstance(canvas, {
            dataUrl: assets[3],
            frameworkUrl: assets[1],
            codeUrl: assets[2],
            streamingAssetsUrl: `${demoRoot}StreamingAssets`,
            companyName: 'Semen Malyshev',
            productName: 'MapPinner',
            productVersion: '1.0',
        }, (progress) => {
            status.textContent = `Загрузка MapPinner: ${Math.round(progress * 100)} % · первый запуск загружает около 18 МБ`;
        });
    }

    openButton.addEventListener('click', async () => {
        prefetchController.abort();
        dialog.showModal();
        document.body.classList.add('map-demo-open');
        status.hidden = false;
        status.textContent = 'Подготовка демо… Первый запуск загружает около 18 МБ.';
        await closing;
        if (!dialog.open) return;

        if (!loadingPromise) loadingPromise = startDemo();
        try {
            unityInstance = await loadingPromise;
            if (dialog.open) status.hidden = true;
        } catch (error) {
            status.textContent = 'Не удалось запустить демо. Попробуйте обновить страницу.';
            console.error('[MapPinner] WebGL failed:', error);
        }
    });

    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
        document.body.classList.remove('map-demo-open');
        openButton.focus();
        closing = (async () => {
            if (loadingPromise) await loadingPromise.catch(() => {});
            if (window.mapPinnerStorageReady) await window.mapPinnerStorageReady.catch(() => {});
            if (unityInstance) await unityInstance.Quit();
            unityInstance = null;
            loadingPromise = null;
        })();
    });

    async function prefetchDemo() {
        if (navigator.connection?.saveData || prefetchController.signal.aborted) return;
        for (const url of assets) {
            if (prefetchController.signal.aborted) break;
            try {
                const response = await fetch(url, { priority: 'low', signal: prefetchController.signal });
                if (!response.ok) break;
                if (response.body) {
                    const reader = response.body.getReader();
                    while (!(await reader.read()).done) { /* drain into the browser cache */ }
                } else {
                    await response.blob();
                }
            } catch (error) {
                if (error.name !== 'AbortError') console.debug('[MapPinner] Background preload unavailable:', error);
                break;
            }
        }
    }

    window.addEventListener('load', () => {
        if ('requestIdleCallback' in window) window.requestIdleCallback(prefetchDemo, { timeout: 5000 });
        else window.setTimeout(prefetchDemo, 1500);
    });
}
