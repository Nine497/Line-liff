import liff from "@line/liff";

// Errors from liff.init() are intentionally NOT caught here — they must
// propagate to the caller (useInitApp) so a genuine init failure (bad
// network, misconfigured LIFF ID, browser restrictions) surfaces the
// initError/retry UI, instead of being swallowed into the same `null`
// return value used for the "redirecting to login" case below and leaving
// the user on a blank screen with no explanation.
export const initLiff = async () => {
    await liff.init({
        liffId: "2010276905-UkTP7t2o",
        withLoginOnExternalBrowser: true,
    });

    // ถ้ายังไม่ login — this triggers a page redirect, not a failure, so
    // it still returns null but never reaches the catch block above.
    if (!liff.isLoggedIn()) {
        liff.login();
        return null;
    }

    return liff;
};