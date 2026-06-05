import liff from "@line/liff";

export const initLiff = async () => {
    try {
        await liff.init({
            liffId: "2010276905-UkTP7t2o",
            withLoginOnExternalBrowser: true,
        });

        console.log("LIFF initialized");

        // ถ้ายังไม่ login
        if (!liff.isLoggedIn()) {
            console.log("User not logged in");

            liff.login();

            return null;
        }

        console.log("isLoggedIn:", liff.isLoggedIn());
        console.log("isInClient:", liff.isInClient());

        // debug token
        console.log("AccessToken:", liff.getAccessToken());
        console.log("IDToken:", liff.getIDToken());
        console.log("Decoded:", liff.getDecodedIDToken());

        return liff;
    } catch (error) {
        console.error("LIFF init error:", error);

        return null;
    }
};