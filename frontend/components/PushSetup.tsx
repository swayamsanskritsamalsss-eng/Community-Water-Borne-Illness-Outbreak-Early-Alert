"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  getPushPublicKey,
  savePushSubscription,
} from "../lib/api";


function urlBase64ToUint8Array(
  base64String: string
) {

  const padding =
    "=".repeat(
      (4 -
        (base64String.length % 4)) %
        4
    );

  const base64 =
    (
      base64String +
      padding
    )
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (character) =>
        character.charCodeAt(0)
    )
  );
}


export default function PushSetup() {

  const [
    status,
    setStatus,
  ] = useState<
    "checking" |
    "ready" |
    "unsupported" |
    "blocked" |
    "enabled"
  >("checking");


  useEffect(() => {

    async function setupPush() {

      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      if (
        !(
          "serviceWorker" in
          navigator
        )
      ) {
        setStatus("unsupported");
        return;
      }

      if (
        !(
          "PushManager" in
          window
        )
      ) {
        setStatus("unsupported");
        return;
      }

      if (
        !(
          "Notification" in
          window
        )
      ) {
        setStatus("unsupported");
        return;
      }


      try {

        const registration =
          await navigator.serviceWorker.register(
            "/sw.js"
          );


        let permission =
          Notification.permission;


        if (
          permission ===
          "default"
        ) {

          permission =
            await Notification.requestPermission();
        }


        if (
          permission !==
          "granted"
        ) {

          setStatus("blocked");
          return;
        }


        const response =
          await getPushPublicKey();

        const publicKey =
          response.public_key;


        if (!publicKey) {

          setStatus("ready");
          return;
        }


        let subscription =
          await registration.pushManager.getSubscription();


        if (!subscription) {

          subscription =
            await registration.pushManager.subscribe(
              {
                userVisibleOnly: true,

                applicationServerKey:
                  urlBase64ToUint8Array(
                    publicKey
                  ),
              }
            );
        }


        await savePushSubscription(
          subscription
        );


        setStatus("enabled");

      } catch (error) {

        console.error(
          "Push notification setup failed:",
          error
        );

        setStatus("ready");
      }
    }


    setupPush();

  }, []);


  if (
    status === "checking" ||
    status === "enabled"
  ) {
    return null;
  }


  if (
    status === "unsupported"
  ) {

    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Push notifications are not
        supported by this browser.
      </div>
    );
  }


  if (
    status === "blocked"
  ) {

    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Notifications are disabled.
        Enable notifications in your
        browser/device settings to
        receive Aarogya alerts.
      </div>
    );
  }


  return null;
}