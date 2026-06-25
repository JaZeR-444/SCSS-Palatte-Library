// ==UserScript==
// @name         One-click phone search helper
// @namespace    https://github.com/JaZeR-444/SCSS-Palatte-Library
// @version      1.0.0
// @description  Turns visible phone numbers into one-click search buttons that reuse the page's existing Search button.
// @match        *://*/*
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  const PHONE_PATTERN =
    /(^|[^\w])((?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?:\s*(?:x|ext\.?)\s*\d{1,6})?)(?!\w)/gi;
  const WRAPPED_ATTR = "data-one-click-phone-search";
  const SKIP_SELECTOR = [
    "a",
    "button",
    "input",
    "textarea",
    "select",
    "option",
    "script",
    "style",
    "noscript",
    `[${WRAPPED_ATTR}]`,
  ].join(",");

  function normalizePhone(phone) {
    const extensionMatch = phone.match(/\b(?:x|ext\.?)\s*(\d{1,6})\b/i);
    const digits = phone.replace(/\D/g, "");
    const baseDigits = extensionMatch
      ? digits.slice(0, -extensionMatch[1].length)
      : digits;

    return baseDigits.length === 11 && baseDigits.startsWith("1")
      ? baseDigits.slice(1)
      : baseDigits;
  }

  function canProcessTextNode(node) {
    if (!node.nodeValue || !PHONE_PATTERN.test(node.nodeValue)) return false;
    PHONE_PATTERN.lastIndex = 0;

    const parent = node.parentElement;
    return Boolean(parent && !parent.closest(SKIP_SELECTOR));
  }

  function createPhoneButton(phone) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = phone;
    button.title = `Search ${normalizePhone(phone)}`;
    button.setAttribute(WRAPPED_ATTR, "true");
    button.className = "one-click-phone-search";
    button.addEventListener("click", () => searchPhone(button));
    return button;
  }

  function wrapPhoneNumbers(textNode) {
    const value = textNode.nodeValue;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let match;

    PHONE_PATTERN.lastIndex = 0;
    while ((match = PHONE_PATTERN.exec(value))) {
      const prefix = match[1] || "";
      const phone = match[2];
      const phoneStart = match.index + prefix.length;

      if (phoneStart > cursor) {
        fragment.append(document.createTextNode(value.slice(cursor, phoneStart)));
      }

      fragment.append(createPhoneButton(phone));
      cursor = phoneStart + phone.length;
    }

    if (cursor < value.length) {
      fragment.append(document.createTextNode(value.slice(cursor)));
    }

    textNode.parentNode.replaceChild(fragment, textNode);
  }

  function selectElementText(element) {
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);

    document.dispatchEvent(new Event("selectionchange", { bubbles: true }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
  }

  function findSearchButton() {
    return (
      document.querySelector("button#sear.sear") ||
      document.querySelector("button#sear") ||
      [...document.querySelectorAll("button")].find(
        (button) => button.textContent.trim().toLowerCase() === "search"
      )
    );
  }

  function waitForSearchButton(timeoutMs = 1200) {
    return new Promise((resolve) => {
      const existing = findSearchButton();
      if (existing) {
        resolve(existing);
        return;
      }

      const observer = new MutationObserver(() => {
        const button = findSearchButton();
        if (button) {
          observer.disconnect();
          resolve(button);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      window.setTimeout(() => {
        observer.disconnect();
        resolve(findSearchButton());
      }, timeoutMs);
    });
  }

  async function searchPhone(phoneButton) {
    selectElementText(phoneButton);

    const searchButton = await waitForSearchButton();
    if (searchButton) {
      searchButton.click();
      return;
    }

    window.alert(`Search button was not found for ${normalizePhone(phoneButton.textContent)}.`);
  }

  function scan(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return canProcessTextNode(node)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];

    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(wrapPhoneNumbers);
  }

  function installStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .one-click-phone-search {
        display: inline;
        padding: 1px 5px;
        border: 0;
        border-radius: 999px;
        background: #fff1f2;
        color: #be123c;
        cursor: pointer;
        font: inherit;
        text-decoration: underline;
        text-underline-offset: 2px;
      }

      .one-click-phone-search:hover,
      .one-click-phone-search:focus-visible {
        background: #ff6574;
        color: #fff;
        outline: none;
      }
    `;
    document.head.append(style);
  }

  function observeChanges() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE && canProcessTextNode(node)) {
            wrapPhoneNumbers(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            scan(node);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  installStyles();
  scan();
  observeChanges();
})();
