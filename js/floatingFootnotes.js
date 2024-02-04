// js/utils.js
function docReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(fn, 1);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

function windowLoaded(fn) {
    if (document.readyState === "complete") {
        setTimeout(fn, 1);
    } else {
        window.addEventListener("load", fn);
    }
}

function onWindowResize(fn) {
    windowLoaded(function () {
        window.addEventListener('resize', fn);
        setTimeout(fn, 1);
    });
}

// js/floatingFootnotes.js
const ARTICLE_CONTENT_SELECTOR = "article#main";
const FOOTNOTE_SECTION_SELECTOR = "div.footnotes[role=doc-endnotes]";
const INDIVIDUAL_FOOTNOTE_SELECTOR = "li[id^='fn:']";
const FLOATING_FOOTNOTE_MIN_WIDTH = 1260;

function computeOffsetForAlignment(elemToAlign, targetAlignment) {
    const offsetParentTop = elemToAlign.offsetParent.getBoundingClientRect().top;
    return targetAlignment.getBoundingClientRect().top - offsetParentTop;
}

function setFootnoteOffsets(footnotes) {
    let bottomOfLastElem = 0;
    Array.prototype.forEach.call(footnotes, function (footnote, i) {
        const intextLink = document.querySelector("a.footnote-ref[href='#" + footnote.id + "']");
        const verticalAlignmentTarget = intextLink.closest('p,li') || intextLink;
        let offset = computeOffsetForAlignment(footnote, verticalAlignmentTarget);
        if (offset < bottomOfLastElem) {
            offset = bottomOfLastElem;
        }
        bottomOfLastElem =
            offset +
            footnote.offsetHeight +
            parseInt(window.getComputedStyle(footnote).marginBottom) +
            parseInt(window.getComputedStyle(footnote).marginTop);
        footnote.style.top = offset + 'px';
        footnote.style.position = 'absolute';
    });
}

function clearFootnoteOffsets(footnotes) {
    Array.prototype.forEach.call(footnotes, function (fn, i) {
        fn.style.top = null;
        fn.style.position = null;
    });
}

function updateFootnoteFloat(shouldFloat) {
    const footnoteSection = document.querySelector(FOOTNOTE_SECTION_SELECTOR);
    const footnotes = footnoteSection.querySelectorAll(INDIVIDUAL_FOOTNOTE_SELECTOR);

    if (shouldFloat) {
        footnoteSection.classList.add('floating-footnotes');
        setFootnoteOffsets(footnotes);
        subscribeToUpdates();
    } else {
        unsubscribeFromUpdates();
        clearFootnoteOffsets(footnotes);
        footnoteSection.classList.remove('floating-footnotes');
    }
}

function subscribeToUpdates() {
    const article = document.querySelector(ARTICLE_CONTENT_SELECTOR);
    resizeObserver.observe(article);
}

function unsubscribeFromUpdates() {
    resizeObserver.disconnect();
}

const notifySizeChange = function() {
    let bigEnough = false;

    return function () {
        let nowBigEnough = window.innerWidth >= FLOATING_FOOTNOTE_MIN_WIDTH;
        if (nowBigEnough !== bigEnough) {
            updateFootnoteFloat(nowBigEnough);
            bigEnough = nowBigEnough;
        }
    };
}();

const resizeObserver = new ResizeObserver((_entries, observer) => {
    updateFootnoteFloat(true);
});

// js/anchorizeHeadings.js
function anchorForId(id) {
    const anchor = document.createElement("a");
    anchor.className = "header-link";
    anchor.title = "Link to this section";
    anchor.href = "#" + id;
    anchor.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><path d="M5.88..."/></svg>';
    return anchor;
}

function anchorizeHeadings() {
    const articles = document.querySelectorAll('article#main');
    if (articles.length != 1) {
        return;
    }
    const headers = articles[0].querySelectorAll('h2, h3, h4');
    Array.prototype.forEach.call(headers, function (el, i) {
        var link = anchorForId(el.id);
        el.appendChild(link);
    });
}

// js/main.js
docReady(() => {
    const footnoteSection = document.querySelector(FOOTNOTE_SECTION_SELECTOR);
    const article = document.querySelector(ARTICLE_CONTENT_SELECTOR);
    const allowFloatingFootnotes = article && !article.classList.contains('no-floating-footnotes');

    if (footnoteSection && allowFloatingFootnotes) {
        enableFloatingFootnotes();
        anchorizeHeadings();
        onWindowResize(notifySizeChange);
    }
});
