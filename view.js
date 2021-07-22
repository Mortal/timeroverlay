var design = {
    fontFamily: "sans-serif",
    fontWeight: "700",
    backgroundColor: "#111",
    color: "#dde",
    padding: "30px",
    display: "inline-block"
};
var eventSpecs = [
    {
        mode: "countdown",
        since: "21:05:00",
        until: "22:00:00",
        format: "m:ss",
        text: "Next chug in {}"
    },
    {
        mode: "stopwatch",
        since: "22:00:00",
        until: "22:05:00",
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
function parseTime(t) {
    var mo = /^(\d+):(\d+):(\d+)$/.exec(t);
    return +mo[1] * 3600000 + +mo[2] * 60000 + +mo[3] * 1000;
}
function parseEventSpec(eventSpec) {
    var sinceMillis = parseTime(eventSpec.since);
    var untilMillis = parseTime(eventSpec.until);
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
        var extra = (i ? "" : before) + eventSpec.format.slice(i, j - mo[0].length);
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
    var computeText = function (t) { return parts.map(function (_a) {
        var align = _a.align, extra = _a.extra, div = _a.div, mod = _a.mod;
        return extra + (align + (((mod ? (t % (mod * div)) : t) / div) | 0)).substr(-align.length);
    }).join("") + after; };
    var computeTime = function (t) { return (eventSpec.mode === "countdown" ? (untilMillis - t) : (t - sinceMillis)); };
    return { computeText: computeText, computeTime: computeTime, sinceMillis: sinceMillis, untilMillis: untilMillis };
}
// console.log(parseEventSpec({mode: "countdown", since: "01:00:00", until: "02:00:00", format: "ss", text: "{}"}).computeText(1996000))
function setup() {
    var div = document.getElementById("timeroverlay");
    for (var _i = 0, _a = Object.keys(design); _i < _a.length; _i++) {
        var k = _a[_i];
        div.style[k] = design[k];
    }
    var now = new Date();
    var midnight = +new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var i = 0;
    var e = parseEventSpec(eventSpecs[i]);
    function keydown(ev) {
        if (ev.code === "ArrowLeft") {
            i -= 1;
        }
        if (ev.code === "ArrowRight") {
            i += 1;
        }
        console.log({ i: i });
        i = Math.min(eventSpecs.length - 1, Math.max(0, i));
        e = parseEventSpec(eventSpecs[i]);
    }
    window.addEventListener("keydown", keydown, false);
    function update() {
        var time = +new Date() - midnight;
        while (i + 1 < eventSpecs.length && e.untilMillis < time) {
            i += 1;
            e = parseEventSpec(eventSpecs[i]);
        }
        var t = e.computeTime(time);
        // console.log({t})
        div.textContent = e.computeText(t);
        window.requestAnimationFrame(update);
    }
    window.requestAnimationFrame(update);
}
window.addEventListener("load", setup, false);
