import liff from "@line/liff";

export const initLiff = async () => {
    try {
        await liff.init({
            liffId: "2010276905-UkTP7t2o",
            withLoginOnExternalBrowser: true,
        });


        // ถ้ายังไม่ login
        if (!liff.isLoggedIn()) {

            liff.login();

            return null;
        }

        return liff;
    } catch (error) {
        console.error("LIFF init error:", error);

        return null;
    }
};