const http = require("http");

let sensorData = {
device_id: "ESP32-SMART-HOME",
suhu: 0,
kelembaban: 0,
lampu: 0,
updated_at: null
};

let lightCommand = 0;

const html = `<!DOCTYPE html>

<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ESP32 Smart Home</title>
<script src="https://cdn.tailwindcss.com"></script>
</head>

<body class="bg-slate-900 text-white min-h-screen">

<div class="max-w-5xl mx-auto p-5">

<h1 class="text-3xl font-bold mb-1">
ESP32 Smart Home
</h1>

<p class="text-slate-400 mb-6">
Monitoring & kontrol rumah pintar
</p>

<div class="bg-slate-800 rounded-2xl p-5 mb-5">
<p class="text-sm text-slate-400">Status ESP32</p>
<p id="deviceStatus"
class="text-xl font-bold text-yellow-400">
MENUNGGU ESP32
</p>
</div>

<div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

<div class="bg-slate-800 rounded-2xl p-6">
<p class="text-slate-400">Suhu</p>
<div class="text-5xl font-bold mt-2">
<span id="temperature">--</span> °C
</div>
</div>

<div class="bg-slate-800 rounded-2xl p-6">
<p class="text-slate-400">Kelembapan</p>
<div class="text-5xl font-bold mt-2">
<span id="humidity">--</span> %
</div>
</div>

</div>

<div class="bg-slate-800 rounded-2xl p-6">

<div class="flex justify-between items-center mb-5">

<div>
<p class="text-sm text-slate-400">
Kontrol Lampu
</p>

<h2 id="lampStatus"
class="text-2xl font-bold">
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
class="bg-green-600 rounded-xl py-4 font-bold">
NYALAKAN </button>

<button
onclick="setLamp(0)"
class="bg-red-600 rounded-xl py-4 font-bold">
MATIKAN </button>

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

</div>

<script>

async function updateDashboard() {

try {

const response =
await fetch("/api/status");

if (!response.ok) return;

const data =
await response.json();

document.getElementById(
"temperature"
).textContent =
data.suhu ?? "--";

document.getElementById(
"humidity"
).textContent =
data.kelembaban ?? "--";

updateLampUI(data.lampu);

const status =
document.getElementById(
"deviceStatus"
);

if (data.updated_at) {

const age =
Date.now() -
new Date(data.updated_at).getTime();

if (age < 5000) {

status.textContent = "ONLINE";

status.className =
"text-xl font-bold text-green-400";

} else {

status.textContent = "OFFLINE";

status.className =
"text-xl font-bold text-red-400";

}

document.getElementById(
"lastUpdate"
).textContent =
"Update: " +
new Date(
data.updated_at
).toLocaleTimeString("id-ID");

}

} catch (error) {

console.log(error);

}

}

function updateLampUI(value) {

const status =
document.getElementById(
"lampStatus"
);

const indicator =
document.getElementById(
"lampIndicator"
);

if (
value === 1 ||
value === true ||
value === "1"
) {

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
document.getElementById(
"commandStatus"
);

status.textContent =
value === 1
? "Mengirim perintah ON..."
: "Mengirim perintah OFF...";

try {

const response =
await fetch("/api/light", {

method: "POST",

headers: {
"Content-Type":
"application/json"
},

body: JSON.stringify({
device_id:
"ESP32-SMART-HOME",
lampu: value
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

status.textContent =
value === 1
? "Lampu diperintahkan ON"
: "Lampu diperintahkan OFF";

} catch (error) {

status.textContent =
"Gagal: " + error.message;

}

}

setInterval(
updateDashboard,
500
);

updateDashboard();

</script>

</body>
</html>`;

function sendJSON(res, code, data) {

res.statusCode = code;

res.setHeader(
"Content-Type",
"application/json"
);

res.end(
JSON.stringify(data)
);

}

function readBody(req) {

return new Promise(
(resolve, reject) => {

let body = "";

req.on("data", chunk => {

body += chunk;

});

req.on("end", () => {

resolve(body);

});

req.on("error", error => {

reject(error);

});

}
);

}

async function handler(req, res) {

try {

const url = new URL(
req.url,
"http://" +
(req.headers.host || "localhost")
);

const pathname =
url.pathname;

if (
pathname === "/" ||
pathname === "/index.html"
) {

res.statusCode = 200;

res.setHeader(
"Content-Type",
"text/html; charset=utf-8"
);

return res.end(html);

}

if (
pathname === "/api/status" &&
req.method === "GET"
) {

return sendJSON(
res,
200,
{
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
}
);

}

if (
pathname === "/api/command" &&
req.method === "GET"
) {

return sendJSON(
res,
200,
{
device_id:
url.searchParams.get(
"device_id"
) ||
"ESP32-SMART-HOME",

lampu:
lightCommand
}
);

}

if (
pathname === "/api/light" &&
req.method === "POST"
) {

const body =
await readBody(req);

const data =
JSON.parse(body);

if (
data.lampu === 1 ||
data.lampu === true ||
data.lampu === "1"
) {

lightCommand = 1;

} else {

lightCommand = 0;

}

return sendJSON(
res,
200,
{
success: true,
lampu: lightCommand
}
);

}

if (
pathname === "/api/sensor" &&
req.method === "POST"
) {

const body =
await readBody(req);

const data =
JSON.parse(body);

sensorData.device_id =
data.device_id ||
"ESP32-SMART-HOME";

sensorData.suhu =
Number(data.suhu) || 0;

sensorData.kelembaban =
Number(data.kelembaban) || 0;

sensorData.lampu =
data.lampu ? 1 : 0;

sensorData.updated_at =
new Date().toISOString();

return sendJSON(
res,
200,
{
success: true,
data: sensorData
}
);

}

return sendJSON(
res,
404,
{
success: false,
error:
"Endpoint tidak ditemukan"
}
);

} catch (error) {

console.error(
"FUNCTION ERROR:",
error
);

return sendJSON(
res,
500,
{
success: false,
error:
"Internal Server Error",
message:
error.message
}
);

}

}

module.exports = handler;
