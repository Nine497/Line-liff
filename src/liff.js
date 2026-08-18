import liff from "@line/liff";

// Errors from liff.init() are intentionally NOT caught here — they must
// propagate to the caller (useInitApp) so a genuine init failure (bad
// network, misconfigured LIFF ID, browser restrictions) surfaces the
// initError/retry UI, instead of being swallowed into the same `null`
// return value used for the "redirecting to login" case below and leaving
// the user on a blank screen with no explanation.
export const initLiff = async () => {
    try {
        await liff.init({
            liffId: import.meta.env.VITE_LIFF_ID || "2010276905-UkTP7t2o",
            withLoginOnExternalBrowser: true,
        });
    } catch (err) {
        console.warn("LIFF init warning:", err);
    }

    return liff;
};