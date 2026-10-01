const http = require("http");

let sensorData = {
device_id: "ESP32-SMART-HOME",
suhu: 0,
kelembaban: 0,
lampu: 0,
updated_at: null
};

let lightCommand = 0;

const html = `

<!DOCTYPE html>

<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESP32 Smart Home</title>

```
<script src="https://cdn.tailwindcss.com"></script>

<style>
    body {
        font-family: Arial, sans-serif;
        background: #0f172a;
        color: white;
        margin: 0;
    }

    .card {
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 18px;
    }

    button {
        cursor: pointer;
        transition: 0.15s;
    }

    button:active {
        transform: scale(0.96);
    }
</style>
```

</head>

<body>

<div class="max-w-5xl mx-auto p-5">

```
<h1 class="text-3xl font-bold mb-1">
    ESP32 Smart Home
</h1>

<p class="text-slate-400 mb-6">
    Monitoring & kontrol rumah pintar
</p>


<!-- STATUS ESP32 -->

<div class="card p-5 mb-5">

    <div class="flex items-center justify-between">

        <div>

            <p class="text-sm text-slate-400">
                Status ESP32
            </p>

            <p id="deviceStatus"
               class="text-xl font-bold text-yellow-400">
                MENUNGGU ESP32
            </p>

        </div>

        <div id="statusDot"
             class="w-4 h-4 rounded-full bg-yellow-500">
        </div>

    </div>

</div>


<!-- SENSOR -->

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

    <div class="card p-6">

        <p class="text-slate-400">
            Suhu
        </p>

        <div class="flex items-end gap-2 mt-2">

            <span id="temperature"
                  class="text-5xl font-bold">
                --
            </span>

            <span class="text-slate-400 mb-2">
                °C
            </span>

        </div>

    </div>


    <div class="card p-6">

        <p class="text-slate-400">
            Kelembapan
        </p>

        <div class="flex items-end gap-2 mt-2">

            <span id="humidity"
                  class="text-5xl font-bold">
                --
            </span>

            <span class="text-slate-400 mb-2">
                %
            </span>

        </div>

    </div>

</div>


<!-- KONTROL LAMPU -->

<div class="card p-6">

    <div class="flex items-center justify-between mb-5">

        <div>

            <p class="text-sm text-slate-400">
                Kontrol Lampu
            </p>

            <h2 id="lampStatus"
                class="text-2xl font-bold text-slate-300">
                OFF
            </h2>

        </div>

        <div id="lampIndicator"
             class="w-12 h-12 rounded-full bg-slate-700">
        </div>

    </div>


    <div class="grid grid-cols-2 gap-4">

        <button
            onclick="setLamp(1)"
            class="bg-green-600 hover:bg-green-500 rounded-xl py-4 font-bold text-lg">

            NYALAKAN

        </button>


        <button
            onclick="setLamp(0)"
            class="bg-red-600 hover:bg-red-500 rounded-xl py-4 font-bold text-lg">

            MATIKAN

        </button>

    </div>


    <p id="commandStatus"
       class="text-center text-sm text-slate-400 mt-4">

        Siap menerima perintah

    </p>

</div>


<p id="lastUpdate"
   class="text-center text-xs text-slate-500 mt-5">

    Belum ada data

</p>
```

</div>

<script>

async function updateDashboard() {

    try {

        const response = await fetch("/api/status");

        if (!response.ok) {
            return;
        }

        const data = await response.json();


        document.getElementById("temperature").textContent =
            data.suhu ?? "--";


        document.getElementById("humidity").textContent =
            data.kelembaban ?? "--";


        updateLampUI(data.lampu);


        const status =
            document.getElementById("deviceStatus");


        const dot =
            document.getElementById("statusDot");


        if (data.updated_at) {

            const last =
                new Date(data.updated_at).getTime();


            const age =
                Date.now() - last;


            if (age < 5000) {

                status.textContent = "ONLINE";

                status.className =
                    "text-xl font-bold text-green-400";

                dot.className =
                    "w-4 h-4 rounded-full bg-green-500";

            } else {

                status.textContent = "OFFLINE";

                status.className =
                    "text-xl font-bold text-red-400";

                dot.className =
                    "w-4 h-4 rounded-full bg-red-500";

            }

        }


        if (data.updated_at) {

            document.getElementById("lastUpdate").textContent =
                "Update: " +
                new Date(data.updated_at)
                    .toLocaleTimeString("id-ID");

        }

    } catch (error) {

        console.log(error);

    }

}


function updateLampUI(value) {

    const status =
        document.getElementById("lampStatus");


    const indicator =
        document.getElementById("lampIndicator");


    if (value === 1 || value === true) {

        status.textContent = "ON";

        status.className =
            "text-2xl font-bold text-green-400";

        indicator.className =
            "w-12 h-12 rounded-full bg-yellow-400";

    } else {

        status.textContent = "OFF";

        status.className =
            "text-2xl font-bold text-slate-300";

        indicator.className =
            "w-12 h-12 rounded-full bg-slate-700";

    }

}


async function setLamp(value) {

    const status =
        document.getElementById("commandStatus");


    if (value === 1) {

        status.textContent =
            "Mengirim perintah ON...";

    } else {

        status.textContent =
            "Mengirim perintah OFF...";

    }


    try {

        const response =
            await fetch("/api/light", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    device_id:
                        "ESP32-SMART-HOME",

                    lampu:
                        value

                })

            });


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Gagal mengirim perintah"
            );

        }


        updateLampUI(value);


        if (value === 1) {

            status.textContent =
                "Lampu diperintahkan ON";

        } else {

            status.textContent =
                "Lampu diperintahkan OFF";

        }

    } catch (error) {

        status.textContent =
            "Gagal: " +
            error.message;

    }

}


setInterval(updateDashboard, 500);

updateDashboard();

</script>

</body>
</html>
`;

function handler(req, res) {

```
const url = new URL(
    req.url,
    "http://" +
    (req.headers.host || "localhost")
);


const pathname =
    url.pathname;


// DASHBOARD

if (
    pathname === "/" ||
    pathname === "/index.html"
) {

    res.setHeader(
        "Content-Type",
        "text/html; charset=utf-8"
    );

    res.statusCode = 200;

    return res.end(html);

}


// ESP32 -> SENSOR

if (
    pathname === "/api/sensor" &&
    req.method === "POST"
) {

    let body = "";


    req.on("data", function(chunk) {

        body += chunk;

    });


    req.on("end", function() {

        try {

            const data =
                JSON.parse(body);


            sensorData = {

                device_id:
                    data.device_id ||
                    "ESP32-SMART-HOME",

                suhu:
                    Number(data.suhu) || 0,

                kelembaban:
                    Number(data.kelembaban) || 0,

                lampu:
                    data.lampu ? 1 : 0,

                updated_at:
                    new Date().toISOString()

            };


            res.setHeader(
                "Content-Type",
                "application/json"
            );


            res.statusCode = 200;


            res.end(
                JSON.stringify({

                    success: true,

                    data:
                        sensorData

                })
            );


        } catch (error) {

            res.setHeader(
                "Content-Type",
                "application/json"
            );


            res.statusCode = 400;


            res.end(
                JSON.stringify({

                    success: false,

                    error:
                        "JSON tidak valid"

                })
            );

        }

    });


    return;

}


// STATUS

if (
    pathname === "/api/status" &&
    req.method === "GET"
) {

    res.setHeader(
        "Content-Type",
        "application/json"
    );


    res.statusCode = 200;


    return res.end(
        JSON.stringify({

            device_id:
                sensorData.device_id,

            suhu:
                sensorData.suhu,

            kelembaban:
                sensorData.kelembaban,

            lampu:
                lightCommand,

            updated_at:
                sensorData.updated_at

        })
    );

}


// KONTROL LAMPU

if (
    pathname === "/api/light" &&
    req.method === "POST"
) {

    let body = "";


    req.on("data", function(chunk) {

        body += chunk;

    });


    req.on("end", function() {

        try {

            const data =
                JSON.parse(body);


            const value =
                data.lampu === 1 ||
                data.lampu === true ||
                data.lampu === "1"
                    ? 1
                    : 0;


            lightCommand =
                value;


            res.setHeader(
                "Content-Type",
                "application/json"
            );


            res.statusCode = 200;


            res.end(
                JSON.stringify({

                    success: true,

                    lampu:
                        lightCommand,

                    message:
                        value === 1
                            ? "Lampu ON"
                            : "Lampu OFF"

                })
            );


        } catch (error) {

            res.setHeader(
                "Content-Type",
                "application/json"
            );


            res.statusCode = 400;


            res.end(
                JSON.stringify({

                    success: false,

                    error:
                        "Perintah tidak valid"

                })
            );

        }

    });


    return;

}


// ESP32 -> COMMAND

if (
    pathname === "/api/command" &&
    req.method === "GET"
) {

    res.setHeader(
        "Content-Type",
        "application/json"
    );


    res.statusCode = 200;


    return res.end(
        JSON.stringify({

            device_id:
                url.searchParams.get("device_id") ||
                "ESP32-SMART-HOME",

            lampu:
                lightCommand

        })
    );

}


// 404

res.setHeader(
    "Content-Type",
    "application/json"
);


res.statusCode = 404;


res.end(
    JSON.stringify({

        success: false,

        error:
            "Endpoint tidak ditemukan"

    })
);
```

}

if (require.main === module) {

```
const PORT =
    process.env.PORT || 3000;


http.createServer(handler)
    .listen(PORT, function() {

        console.log(
            "ESP32 Smart Home berjalan di http://localhost:" +
            PORT
        );

    });
```

}

module.exports = handler;
