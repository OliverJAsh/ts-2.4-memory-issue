const serviceWorkerPath = 'service-worker.js';
const applicationServerKey = 'TODO';
const convertedApplicationServerKey = urlBase64ToUint8Array(
    applicationServerKey,
);

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const subscribe = () => {
    const subscribeOptions = {
        // No silent push, must show notification
        userVisibleOnly: true,
        applicationServerKey: convertedApplicationServerKey,
    };
    return navigator.serviceWorker.getRegistration().then(registration => {
        return registration.pushManager
            .subscribe(subscribeOptions)
            .then(pushSubscription => {
                return fetch('/api/push-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(pushSubscription),
                });
            });
    });
};

// https://web-push-book.gauntface.com/chapter-02/01-subscribing-a-user/
// eslint-disable-next-line no-unused-vars
navigator.serviceWorker.register(serviceWorkerPath).then(registration => {
    // eslint-disable-next-line no-unused-vars
    Notification.requestPermission().then(permission => {
        // TODO: check permission before
        subscribe();
    });
});
