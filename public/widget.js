(function () {
  "use strict";

  var PROJECT_TYPES = ["Kitchen renovation", "Bathroom renovation", "Home extension", "Full renovation", "New home", "Not sure yet"];
  var BUDGETS = ["Under $20k", "$20k – $50k", "$50k – $100k", "$100k+", "Not sure yet"];

  var state = {
    stage: "projectType", // projectType -> budget -> suburb -> leadForm -> chat
    projectType: null,
    budget: null,
    suburb: null,
    history: [], // { role: 'user'|'assistant', text, image? }
    pendingImage: null, // { mimeType, data, previewName }
    leadSaved: false,
  };

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      if (typeof c === "string") e.appendChild(document.createTextNode(c));
      else if (c) e.appendChild(c);
    });
    return e;
  }

  function buildUI() {
    var root = el("div", { id: "ac-chat-root" });

    var bubble = el("div", { class: "ac-bubble" }, ["Need help with your project? 💬"]);

    var launcher = el("button", { class: "ac-launcher", "aria-label": "Open chat with Alert Construction" }, [
      svgIcon("chat"),
    ]);

    var panel = el("div", { class: "ac-panel" });

    var header = el("div", { class: "ac-header" }, [
      el("div", { class: "ac-avatar" }, ["AC"]),
      el("div", { class: "ac-header-text" }, [
        el("div", { class: "ac-header-title" }, ["Alert Construction"]),
        el("div", { class: "ac-header-sub" }, [el("span", { class: "ac-dot" }), "Typically replies in a few minutes"]),
      ]),
      el("button", { class: "ac-close", "aria-label": "Close chat" }, [svgIcon("close")]),
    ]);

    var messages = el("div", { class: "ac-messages" });
    var inputBar = buildInputBar();

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(inputBar.wrap);

    root.appendChild(bubble);
    root.appendChild(panel);
    root.appendChild(launcher);
    document.body.appendChild(root);

    launcher.addEventListener("click", function () {
      panel.classList.toggle("ac-open");
      bubble.style.display = "none";
      if (panel.classList.contains("ac-open") && messages.children.length === 0) {
        startConversation(messages);
      }
    });
    header.querySelector(".ac-close").addEventListener("click", function () {
      panel.classList.remove("ac-open");
    });

    return { messages: messages, input: inputBar };
  }

  function svgIcon(name) {
    var paths = {
      chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
      close: '<path d="M18 6 6 18M6 6l12 12"/>',
      send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',
      clip: '<path d="M21.44 11.05 12.25 20.24a5.5 5.5 0 0 1-7.78-7.78l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a1.5 1.5 0 0 1-2.12-2.12l8.49-8.48"/>',
    };
    var wrap = document.createElement("span");
    wrap.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="' +
      (name === "chat" ? "#1a1a1a" : "currentColor") +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      paths[name] +
      "</svg>";
    return wrap.firstChild;
  }

  function buildInputBar() {
    var wrap = el("div", { class: "ac-inputbar" });
    var preview = el("div", { class: "ac-img-preview", style: "display:none" });
    var row = el("div", { class: "ac-input-row" });
    var fileInput = el("input", { type: "file", accept: "image/*", style: "display:none" });
    var clipBtn = el("button", { class: "ac-icon-btn", type: "button", "aria-label": "Attach a photo" }, [svgIcon("clip")]);
    var textInput = el("input", { type: "text", placeholder: "Type your message…" });
    var sendBtn = el("button", { class: "ac-icon-btn ac-send", type: "button", "aria-label": "Send" }, [svgIcon("send")]);
    var privacy = el("div", { class: "ac-privacy" }, ["Your details are only used to arrange your free site visit."]);

    row.appendChild(clipBtn);
    row.appendChild(textInput);
    row.appendChild(sendBtn);
    wrap.appendChild(preview);
    wrap.appendChild(row);
    wrap.appendChild(privacy);

    clipBtn.addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      var f = fileInput.files[0];
      if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        var base64 = reader.result.split(",")[1];
        state.pendingImage = { mimeType: f.type, data: base64, previewName: f.name };
        preview.style.display = "flex";
        preview.innerHTML = "";
        preview.appendChild(el("span", {}, ["📷 " + f.name]));
        var rm = el("button", { type: "button" }, ["Remove"]);
        rm.addEventListener("click", function () {
          state.pendingImage = null;
          preview.style.display = "none";
          fileInput.value = "";
        });
        preview.appendChild(rm);
      };
      reader.readAsDataURL(f);
    });

    function submit() {
      var text = textInput.value.trim();
      if (!text && !state.pendingImage) return;
      textInput.value = "";
      handleUserInput(text || "(sent a photo)");
      preview.style.display = "none";
      fileInput.value = "";
    }
    sendBtn.addEventListener("click", submit);
    textInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });

    return { wrap: wrap, textInput: textInput };
  }

  var ui;

  function startConversation(messagesEl) {
    addBotMessage("Hi, I'm the Alert Construction assistant 👋 What are you looking to do?");
    addChips(PROJECT_TYPES, function (choice) {
      state.projectType = choice;
      addUserMessage(choice);
      state.stage = "budget";
      setTimeout(function () {
        addBotMessage("Got it — roughly what budget are you thinking?");
        addChips(BUDGETS, function (b) {
          state.budget = b;
          addUserMessage(b);
          state.stage = "suburb";
          setTimeout(function () {
            addBotMessage("Great, and what suburb is the property in?");
          }, 350);
        });
      }, 350);
    });
  }

  function addUserMessage(text, imageName) {
    var row = el("div", { class: "ac-msg ac-msg-user" }, [
      el("div", { class: "ac-bubble2" }, [imageName ? text + "\n📷 " + imageName : text]),
    ]);
    ui.messages.appendChild(row);
    ui.messages.scrollTop = ui.messages.scrollHeight;
    state.history.push({ role: "user", text: text });
  }

  function addBotMessage(text, articles) {
    var row = el("div", { class: "ac-msg ac-msg-bot" }, [
      el("div", { class: "ac-mini-avatar" }, ["AC"]),
      el("div", { class: "ac-bubble2" }, [text]),
    ]);
    ui.messages.appendChild(row);
    if (articles && articles.length) {
      var box = el("div", { class: "ac-articles" });
      articles.forEach(function (a) {
        box.appendChild(el("a", { class: "ac-article-link", href: a.url, target: "_blank", rel: "noopener" }, [a.title]));
      });
      ui.messages.appendChild(box);
    }
    ui.messages.scrollTop = ui.messages.scrollHeight;
    state.history.push({ role: "assistant", text: text });
  }

  function addChips(options, onPick) {
    var box = el("div", { class: "ac-chips" });
    options.forEach(function (opt) {
      var chip = el("button", { class: "ac-chip", type: "button" }, [opt]);
      chip.addEventListener("click", function () {
        box.querySelectorAll(".ac-chip").forEach(function (c) { c.disabled = true; c.style.opacity = 0.5; });
        onPick(opt);
      });
      box.appendChild(chip);
    });
    ui.messages.appendChild(box);
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }

  function addTyping() {
    var row = el("div", { class: "ac-msg ac-msg-bot", "data-typing": "1" }, [
      el("div", { class: "ac-mini-avatar" }, ["AC"]),
      el("div", { class: "ac-bubble2 ac-typing" }, [el("span"), el("span"), el("span")]),
    ]);
    ui.messages.appendChild(row);
    ui.messages.scrollTop = ui.messages.scrollHeight;
    return row;
  }

  function addLeadCard() {
    var card = el("div", { class: "ac-lead-card" });
    card.appendChild(el("div", { class: "ac-lead-title" }, ["GET A CALLBACK"]));
    var name = el("input", { type: "text", placeholder: "Your name" });
    var phone = el("input", { type: "text", placeholder: "Phone number" });
    var btn = el("button", { type: "button" }, ["Request a callback"]);
    card.appendChild(name);
    card.appendChild(phone);
    card.appendChild(btn);
    btn.addEventListener("click", function () {
      if (!name.value.trim() || !phone.value.trim()) return;
      btn.disabled = true;
      btn.textContent = "Sending…";
      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.value.trim(),
          phone: phone.value.trim(),
          suburb: state.suburb,
          projectType: state.projectType,
          budget: state.budget,
        }),
      })
        .then(function (r) { return r.json(); })
        .then(function () {
          card.innerHTML = "";
          card.appendChild(el("div", { style: "font-size:13px;color:#1a1a1a;font-weight:600;" }, ["Thanks! We'll be in touch shortly."]));
          state.leadSaved = true;
        })
        .catch(function () {
          btn.disabled = false;
          btn.textContent = "Request a callback";
        });
    });
    ui.messages.appendChild(card);
    ui.messages.scrollTop = ui.messages.scrollHeight;
  }

  function handleUserInput(text) {
    var img = state.pendingImage;
    addUserMessage(text, img ? img.previewName : null);
    if (img) state.history[state.history.length - 1].image = { mimeType: img.mimeType, data: img.data };
    state.pendingImage = null;

    if (state.stage === "suburb") {
      state.suburb = text;
      state.stage = "chat";
      var typing1 = addTyping();
      sendToBackend(function (reply, articles) {
        typing1.remove();
        addBotMessage(reply, articles);
        addLeadCard();
      });
      return;
    }

    var typing = addTyping();
    sendToBackend(function (reply, articles) {
      typing.remove();
      addBotMessage(reply, articles);
    });
  }

  function sendToBackend(cb) {
    var context = "";
    if (state.projectType) context += "[Project type: " + state.projectType + "] ";
    if (state.budget) context += "[Budget: " + state.budget + "] ";
    if (state.suburb) context += "[Suburb: " + state.suburb + "] ";

    var payloadMessages = state.history.map(function (m, i) {
      var out = { role: m.role, text: m.text };
      if (i === 0 && context) out.text = context + out.text;
      if (i === state.history.length - 1 && m.image) out.image = m.image;
      return out;
    });

    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: payloadMessages }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        cb(data.reply || "Sorry, something went wrong — please try again.", data.articles);
      })
      .catch(function () {
        cb("Sorry, I couldn't connect just now. Please call us on (03) 8820 6567.", []);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { ui = buildUI(); });
  } else {
    ui = buildUI();
  }
})();
