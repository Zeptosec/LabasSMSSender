
import fetch from 'node-fetch';
import { parse } from 'node-html-parser';
import 'dotenv/config';

const parseCookie = str => {
    let rgx = new RegExp(/([^\s]*)=(\s*([^\s;,]*))/, "gm")
    let m;
    let obj = {}
    do {
        m = rgx.exec(str);
        if (m) {
            obj[m[1]] = m[2];
        }
    } while (m);
    return obj;
}

async function login() {
    const rs = await fetch(process.env.LOGIN_PAGE, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "max-age=0",
            "content-type": "application/x-www-form-urlencoded",
            "referrer-policy": "strict-origin-when-cross-origin",
            "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "upgrade-insecure-requests": "1",
            "Referer": `${process.env.REFERER}`,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": `_username=${encodeURIComponent(process.env.LOGIN_NUMBER)}&_password=${encodeURIComponent(process.env.LOGIN_PASSWORD)}`,
        "method": "POST",
        redirect: "manual"
    });
    // parse cookies that were got from login
    let cookis = parseCookie(rs.headers.get("Set-Cookie"));

    const rs2 = await fetch(process.env.MAIN_PAGE, {
        "headers": {
            "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "max-age=0",
            "referrer-policy": "strict-origin-when-cross-origin",
            "sec-ch-ua": "\"Not.A/Brand\";v=\"8\", \"Chromium\";v=\"114\", \"Google Chrome\";v=\"114\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "upgrade-insecure-requests": "1",
            "cookie": `scml=${cookis['scml']}; isUserLoggedIn=${cookis['isUserLoggedIn']}; bite-visitor-ip=${cookis['bite-visitor-ip']}; TS011605d9=${cookis['TS011605d9']}`,
            "Referer": `${process.env.REFERER}`,
            "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        "body": null,
        "method": "GET"
    });
    const txt = await rs2.text();
    const root = parse(txt);
    const tknElem = root.getElementById('sms_submit__token');
    if (tknElem) {
        const submit__token = tknElem.attrs.value;
        return { cookis, token: submit__token };
    } else {
        console.log('missing token probably did not login');
        return null;
    }
}

async function snd(to, msg, token, cookis) {
    const uriTo = encodeURIComponent(to);
    const uriMsg = encodeURIComponent(msg);
    const rs = await fetch("https://mano.labas.lt/", {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
            "cookie": `bite-visitor-ip=${cookis['bite-visitor-ip']}; TS011605d9=${cookis['TS011605d9']}; scml=${cookis['scml']}; isUserLoggedIn=true`,
        },
        "body": `sms_submit%5BrecipientNumber%5D=${uriTo}&sms_submit%5BtextMessage%5D=${uriMsg}&sms_submit%5B_token%5D=${token}`,
        "method": "POST"
    });
}
let logginCreds = {};
async function getCreds() {
    let creds;
    // if user was logged in the past minute then use those credentials
    if (logginCreds.lastTime && new Date().getTime() - logginCreds.lastTime < 60 * 1000) {
        creds = logginCreds;
    } else {
        creds = await login();
        if (creds) {
            creds.lastTime = new Date().getTime();
            logginCreds = creds;
        } else {
            throw Error("Failed to get credentials. Probably failed to login.");
        }
    }
    return creds;
}

/**
 * 
 * @param {string} to the number to send the message to.
 * @param {*} msg the message that will be sent
 * @returns an object with a boolean indicating success and a message with status.
 */
export async function sendMessage(to, msg) {
    if (msg.length >= 500) {
        return { succ: false, msg: "Message was too long. Max 500 chars." };
    }
    try {
        const creds = await getCreds();
        await snd(to, msg, creds.token, creds.cookis);
        return { succ: true, msg: "Message sent!" };
    } catch (rr) {
        console.log(rr);
    }
    return { succ: false, msg: "Failed to send the message." };
}