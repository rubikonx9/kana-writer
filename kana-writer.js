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

    const convertedTexts = wordsByLine.map(words => {
        return words.map(word => convertWord(word.toLowerCase()))
    });

    const [hiragana, katakana] = ["hiragana", "katakana"].map(kanaType => {
        return convertedTexts.map(words => {
            return words.map(word => {
                return makeJishoLink(
                    handleSpecialWords(
                        word[kanaType]
                    )
                );
            }).join(" ");
        }).map(line => {
            return "<img "
                 +     "class='icon' "
                 +     "src='img/icon-clipboard-26x26.png' "
                 +     "onclick='copyToClipboard(this);' "
                 +     "title='Copy line to clipboard'"
                 + "/>"
                 + line;
        }).join("<br>")
    });

    document.getElementById("output-hiragana").innerHTML = hiragana;
    document.getElementById("output-katakana").innerHTML = katakana;
}

/**
 * Copies the clicked text to the clipboard using a hidden text input.
 *
 * @param   {Element} link - Copy icon clicked.
 *
 * @returns {void}
 */
function copyToClipboard(link) {
    const toCopy = Array.prototype.map.call(
        link.parentElement.getElementsByTagName("a"),
        (x) => x.text
    ).join(" ").trim();

    const clipboardInput = document.getElementById("clipboard-input");

    clipboardInput.value = toCopy;
    clipboardInput.select();

    document.execCommand("copy");

    console.log("Copied " + toCopy);
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
    if (word === "わ") {
        return "は";
    }

    return word;
}

/**
 * Creates a link to an on-line dictionary.
 *
 * @param   {String} word - Kana word.
 *
 * @returns {String}
 */
function makeJishoLink(word) {
    return `<a href="https://jisho.org/search/${word}" target="_blank" title="Check in Jisho online dictionary">${word}</a>`;
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
};
