"use strict";

// The longest key name
const maxSubstringLength = Math.max(...Object.keys(Kana).map(s => s.length));

/**
 * Takes all text from the textarea input
 * and generates the hiragana and katakana "translations".
 *
 * @returns {void}
 */
function convertRomajiToKana() {
    const text        = document.getElementById("romaji-input").value;
    const lines       = text.split(/\n/);
    const wordsByLine = lines.map(line => line.split(/\s/));

    const output = document.getElementById("output-kana");
    let idx = 0;

    while (output.firstChild) {
        output.lastChild.remove();
    }

    for (const wordsForLine of wordsByLine) {
        for (const word of wordsForLine) {
            ++idx;

            const {hiragana, katakana} = convertWord(word.toLowerCase());

            const possibleKanas = [
                ...handleSpecialWords(hiragana),
                katakana
            ];

            const mostProbable = possibleKanas[0];
            const span = document.createElement("span");

            span.id        = `word-${idx}`;
            span.innerHTML = mostProbable;

            span.addEventListener("mouseover", (event) => {
                const tooltipContents = possibleKanas.map((kana) => {
                    return makeReplacemenetLink(span.id, kana) + makeJishoLink(kana);
                }).join("<br>");

                showTooltip(event.target, tooltipContents);
            });

            span.addEventListener("mouseout", (event) => {
                hideTooltip();
            });

            output.appendChild(span);
        }

        output.appendChild(document.createElement("br"));
    }
}

function showTooltip(referenceNode, contents) {
    removeHideTooltipTimeout();

    const tooltip = document.getElementById("tooltip");

    tooltip.innerHTML     = contents;
    tooltip.style.opacity = "1.0";

    const referenceNodeRect = referenceNode.getBoundingClientRect();

    tooltip.style.top  = (referenceNode.offsetTop + referenceNodeRect.height) + "px";
    tooltip.style.left = referenceNode.offsetLeft + "px";
}

function hideTooltip() {
    hideTooltip.hideTimeoutID = setTimeout(() => {
        const tooltip = document.getElementById("tooltip");

        tooltip.style.opacity = "0.0";
    }, 100); // enough time for user to move cursor over the tooltip

    hideTooltip.moveAwayTimeoutID = setTimeout(() => {
        tooltip.style.left = "-9999px";
    }, 500); // same as transition time in CSS
}

function removeHideTooltipTimeout() {
    clearTimeout(hideTooltip.hideTimeoutID);
    clearTimeout(hideTooltip.moveAwayTimeoutID);
}

function makeReplacemenetLink(spanID, kana) {
    return `<a href="#" title="Use this word instead" onclick="replaceKana('${spanID}', '${kana}')">${kana}</a>`;
}

function replaceKana(spanID, kana) {
    document.getElementById(spanID).innerHTML = kana;
}

/**
 * Copies the clicked text to the clipboard using a hidden text input.
 *
 * @param   {Element} link - Copy icon clicked.
 *
 * @returns {void}
 */
function copyToClipboard() {
    const toCopy = Array.prototype.map.call(
        document.getElementById("output-kana").getElementsByTagName("span"),
        (span) => span.innerHTML
    ).join("\n").trim();

    const clipboardInput = document.getElementById("clipboard-input");

    clipboardInput.value = toCopy;
    clipboardInput.select();

    document.execCommand("copy");
}

/**
 * Handles some special cases of stand-alone words.
 * Ex. uses は instead of わ to represent "wa";
 *
 * @param   {String} word - Kana word.
 *
 * @returns {String}
 */
function handleSpecialWords(word) {
    const map = {
        "わ": ["は", "わ"],
        "え": ["へ", "え"]
    };

    if (word in map) {
        return map[word];
    }

    return [word];
}

/**
 * Creates a link to an on-line dictionary.
 *
 * @param   {String} word - Kana word.
 *
 * @returns {String}
 */
function makeJishoLink(word) {
    return `<a href="https://jisho.org/search/${word}" target="_blank" title="Check in Jisho online dictionary">
        <img class="icon" src="img/icon-external-link-32x32.png"></img>
    </a>`;
}

/**
 * Converts provided Romaji text to Katakana and Hiragana,
 * as much as possible.
 *
 * @param   {String} romaji
 *
 * @returns {Object}
 */
function convertWord(romaji) {
    const hiragana = [];
    const katakana = [];

    let previousUnmatchedRomaji = "";
    let previousKanaLastVovel   = "";

    // Try each substring
    for (let i = 0; i < romaji.length; ++i) {
        let kanaFound = false;

        // Try longest possible substring first, then shorter ones
        for (let substringLength = maxSubstringLength; substringLength > 0; --substringLength) {
            if ((i + substringLength) > romaji.length) {
                // No enough characters left for this substring
                continue;
            }

            const part = romaji.substring(i, i + substringLength);

            if (!(part in Kana)) {
                // No match
                continue;
            }

            if (previousUnmatchedRomaji && previousUnmatchedRomaji === romaji[i]) {
                // Ah, so the previous unmatched romaji is actually
                // used to double the first consonant in this kana.
                // Remove the unmatched romaji.
                hiragana.pop();
                katakana.pop();

                // Insert the small "tsu" instead.
                hiragana.push(Kana["small-tsu"].Hiragana);
                katakana.push(Kana["small-tsu"].Katakana);
            }

            const kana = Kana[part];

            // This will be the result.
            hiragana.push(kana.Hiragana);

            if (previousKanaLastVovel !== ""
            && (previousKanaLastVovel === romaji[i] || (previousKanaLastVovel === "o" && romaji[i] === "u"))) {
                // We're doubling the same vovel
                katakana.push(Kana["long-vovel"].Katakana);
            } else {
                katakana.push(kana.Katakana);
            }

            kanaFound               = true;
            previousUnmatchedRomaji = "";
            previousKanaLastVovel   = part.split("").pop();

            // Skip all the characters this kana satisfies.
            i += substringLength - 1;

            break;
        }

        if (!kanaFound) {
            // No match found, so let's simply display
            // what the user has written in romaji.
            previousUnmatchedRomaji = romaji[i];

            hiragana.push(previousUnmatchedRomaji);
            katakana.push(previousUnmatchedRomaji);
        }
    }

    return {
        hiragana: hiragana.join(""),
        katakana: katakana.join("")
    };
}

// Translate what's there on page load
window.onload = () => {
    convertRomajiToKana();

    const tooltip = document.getElementById("tooltip");

    tooltip.addEventListener("mouseover", (event) => {
        removeHideTooltipTimeout();
    });

    tooltip.addEventListener("mouseout", (event) => {
        hideTooltip();
    });
};
