import liff from "@line/liff";

export const initLiff = async () => {
    await liff.init({
        liffId: "2010276905-UkTP7t2o",
    });

    if (!liff.isLoggedIn()) {
        liff.login();
        return null;
    }

    return liff;
};