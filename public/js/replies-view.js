// Shows the teacher's replies under the question box. The reply is the teacher's own text,
// so it is put on the page with textContent only (never innerHTML): any "<b>" in it stays plain text.
// Works in the browser (global renderReplies) and in Node with a small fake document (tests/replies-tests.js).
(function (root) {
  function renderReplies(container, list, doc = root.document) {
    while (container.firstChild) container.removeChild(container.firstChild);
    for (const r of list) {
      const box = doc.createElement("div");
      box.className = "notice ok";
      if (r.question) {
        const asked = doc.createElement("p");
        asked.className = "small muted";
        asked.textContent = `You asked: ${r.question}`;
        box.appendChild(asked);
      }
      const answer = doc.createElement("p");
      const label = doc.createElement("b");
      label.textContent = "Your teacher answered:";
      answer.appendChild(label);
      answer.appendChild(doc.createTextNode(` ${r.reply}`));
      box.appendChild(answer);
      container.appendChild(box);
    }
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { renderReplies };
  else root.renderReplies = renderReplies;
})(typeof window !== "undefined" ? window : globalThis);
