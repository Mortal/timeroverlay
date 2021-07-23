function parseTime(t) {
    var mo = /^(\d+):(\d+)(?::(\d+(?:\.\d*)?))?$/.exec(t);
    return +mo[1] * 3600000 + +mo[2] * 60000 + +(mo[3] || "0") * 1000;
}
function parseEventSpec(eventSpec) {
    var sinceMillis = parseTime(eventSpec.since);
    var untilMillis = parseTime(eventSpec.until);
    var paused = false;
    var elapsed = 0;
    var pattern = /m+|s+|f+/g;
    var _a = eventSpec.text.split("{}"), before = _a[0], after = _a[1];
    var parts = [];
    for (;;) {
        var i = pattern.lastIndex;
        var mo = pattern.exec(eventSpec.format);
        if (mo == null)
            break;
        var j = pattern.lastIndex;
        var align = mo[0].length > 1 ? "00000".slice(0, mo[0].length) : "";
        var extra = eventSpec.format.slice(i, j - mo[0].length);
        var c = mo[0].charAt(0);
        if (c === "m")
            parts.push({ align: align, extra: extra, div: 60000, mod: 0 });
        else if (c === "s")
            parts.push({ align: align, extra: extra, div: 1000, mod: 60 });
        else if (mo[0] === "f")
            parts.push({ align: align, extra: extra, div: 100, mod: 10 });
        else if (mo[0] === "ff")
            parts.push({ align: align, extra: extra, div: 10, mod: 100 });
        else if (mo[0] === "fff")
            parts.push({ align: align, extra: extra, div: 1, mod: 1000 });
        else
            parts.push({ align: align, extra: extra + "???", div: 1, mod: 0 });
    }
    var mapPart = function (t, _a) {
        var align = _a.align, extra = _a.extra, div = _a.div, mod = _a.mod;
        if (mod) {
            t = t % (mod * div);
        }
        t = (t / div) | 0;
        return extra + (align + t).substr(-align.length);
    };
    var computeText = function (t) { return before + (t < 0 ? "-" : "") + parts.map(function (part) { return mapPart(Math.abs(t), part); }).join("") + after; };
    var computeTime = function (t) { return (elapsed
        + (paused ? 0 : (eventSpec.mode === "countdown" ? (untilMillis - t) : (t - sinceMillis)))); };
    var keyHandlers = {};
    if (eventSpec.mode === "stopwatch") {
        keyHandlers["Space"] = function (t) {
            elapsed = computeTime(t);
            paused = !paused;
            sinceMillis = t;
        };
        keyHandlers["KeyR"] = function (t) {
            elapsed = 0;
            paused = true;
            sinceMillis = t;
        };
    }
    return { computeText: computeText, computeTime: computeTime, sinceMillis: sinceMillis, untilMillis: untilMillis, keyHandlers: keyHandlers };
}
function setup(div, design, eventSpecs) {
    for (var _i = 0, _a = Object.keys(design); _i < _a.length; _i++) {
        var k = _a[_i];
        div.style[k] = design[k];
    }
    var nowDate = new Date();
    var midnight = +new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
    var i = 0;
    var e = parseEventSpec(eventSpecs[i]);
    var now = function () { return +new Date() - midnight; };
    function keydown(ev) {
        if (e.keyHandlers[ev.code]) {
            e.keyHandlers[ev.code](now(), ev);
            return;
        }
        if (ev.code === "ArrowLeft") {
            i -= 1;
        }
        else if (ev.code === "ArrowRight") {
            i += 1;
        }
        else {
            console.log({ code: ev.code });
            return;
        }
        i = Math.min(eventSpecs.length - 1, Math.max(0, i));
        e = parseEventSpec(eventSpecs[i]);
        ev.preventDefault();
        ev.stopPropagation();
    }
    function update() {
        var time = now();
        while (i + 1 < eventSpecs.length && e.untilMillis < time) {
            i += 1;
            e = parseEventSpec(eventSpecs[i]);
        }
        var t = e.computeTime(time);
        div.textContent = e.computeText(t);
    }
    var updateCallback = function () {
        update();
        window.requestAnimationFrame(updateCallback);
    };
    window.requestAnimationFrame(updateCallback);
    window.addEventListener("keydown", keydown, false);
}
// console.log(parseEventSpec({mode: "countdown", since: "01:00:00", until: "02:00:00", format: "ss", text: "{}"}).computeText(1996000))
window.addEventListener("load", function () {
    var div = document.getElementById("timeroverlay");
    var design = {
        fontFamily: "sans-serif",
        fontWeight: "700",
        backgroundColor: "#000",
        textShadow: "0 0 3px #111",
        color: "#dde",
        padding: "30px",
        display: "inline-block",
        width: "500px",
        textAlign: "center",
        height: "50px",
        fontSize: "40px"
    };
    var eventSpecs = [
        {
            mode: "countdown",
            since: "00:00:00",
            until: "14:55:00",
            format: "m:ss",
            text: "Next chug in {}"
        },
        {
            mode: "stopwatch",
            since: "14:55:00",
            until: "15:55:00",
            format: "m:ss.ff",
            text: "{}"
        },
        {
            mode: "countdown",
            since: "22:05:00",
            until: "22:30:00",
            format: "m:ss",
            text: "Next chug in {}"
        },
        {
            mode: "stopwatch",
            since: "22:30:00",
            until: "22:35:00",
            format: "m:ss.ff",
            text: "{}"
        },
        {
            mode: "countdown",
            since: "22:35:00",
            until: "23:00:00",
            format: "m:ss",
            text: "Next chug in {}"
        },
    ];
    setup(div, design, eventSpecs);
}, false);
