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
const t = window.portfolioText;

if (openButton && closeButton && dialog && canvas && status) {
    let loaderPromise;
    let loadingPromise;
    let unityInstance;
    let closing = Promise.resolve();

    function loadScript() {
        if (!loaderPromise) {
            loaderPromise = new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = assets[0];
                script.onload = resolve;
                script.onerror = () => reject(new Error(t('unityFailed')));
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
            status.textContent = t('demoProgress', { progress: Math.round(progress * 100) });
        });
    }

    openButton.addEventListener('click', async () => {
        dialog.showModal();
        document.body.classList.add('map-demo-open');
        status.hidden = false;
        status.textContent = t('demoPreparing');
        await closing;
        if (!dialog.open) return;

        if (!loadingPromise) loadingPromise = startDemo();
        try {
            unityInstance = await loadingPromise;
            if (dialog.open) status.hidden = true;
        } catch (error) {
            status.textContent = t('demoFailed');
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

}
