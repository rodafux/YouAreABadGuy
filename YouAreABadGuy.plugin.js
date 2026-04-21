/**
 * @name YouAreABadGuy
 * @version 1.0.0
 * @description Visually marks players you no longer want to team up with. Includes local history and server-based export.
 * @author rodafux
 * @authorId 1085975072512151643
 * @website https://github.com/
 * @source https://github.com/
 */
module.exports = class YouAreABadGuy {
    start() {
        try {
            this.strings = {
                en: { mark: "Mark as Bad Guy", unmark: "Unmark Bad Guy", reason: "Reason", date: "Date added", export: "Export Bad Guys", import: "Import Bad Guys", lang: "Language", server: "Select Server", save: "Save", close: "Close", exportBtn: "Export", importBtn: "Import", allServers: "All Servers", success: "Import successful", fail: "Import failed", none: "None" },
                fr: { mark: "Marquer comme Bad Guy", unmark: "Retirer Bad Guy", reason: "Raison", date: "Date d'ajout", export: "Exporter les Bad Guys", import: "Importer les Bad Guys", lang: "Langue", server: "Sélectionner un serveur", save: "Sauvegarder", close: "Fermer", exportBtn: "Exporter", importBtn: "Importer", allServers: "Tous les serveurs", success: "Importation réussie", fail: "Échec de l'importation", none: "Aucun" },
                de: { mark: "Als Bad Guy markieren", unmark: "Bad Guy entfernen", reason: "Grund", date: "Hinzugefügt am", export: "Bad Guys exportieren", import: "Bad Guys importieren", lang: "Sprache", server: "Server auswählen", save: "Speichern", close: "Schließen", exportBtn: "Exportieren", importBtn: "Importieren", allServers: "Alle Server", success: "Import erfolgreich", fail: "Import fehlgeschlagen", none: "Keine" },
                es: { mark: "Marcar como Bad Guy", unmark: "Desmarcar Bad Guy", reason: "Razón", date: "Fecha de adición", export: "Exportar Bad Guys", import: "Importar Bad Guys", lang: "Idioma", server: "Seleccionar servidor", save: "Guardar", close: "Cerrar", exportBtn: "Exportar", importBtn: "Importar", allServers: "Todos los servidores", success: "Importación exitosa", fail: "Fallo en la importación", none: "Ninguno" },
                it: { mark: "Segna come Bad Guy", unmark: "Rimuovi Bad Guy", reason: "Motivo", date: "Data di aggiunta", export: "Esporta Bad Guys", import: "Importa Bad Guys", lang: "Lingua", server: "Seleziona server", save: "Salva", close: "Chiudi", exportBtn: "Esporta", importBtn: "Importa", allServers: "Tutti i server", success: "Importazione riuscita", fail: "Importazione fallita", none: "Nessuno" },
                ru: { mark: "Отметить как Bad Guy", unmark: "Снять отметку Bad Guy", reason: "Причина", date: "Дата добавления", export: "Экспорт Bad Guys", import: "Импорт Bad Guys", lang: "Язык", server: "Выберите сервер", save: "Сохранить", close: "Закрыть", exportBtn: "Экспорт", importBtn: "Импорт", allServers: "Все серверы", success: "Импорт завершен", fail: "Ошибка импорта", none: "Нет" }
            };

            this.customLang = BdApi.Data.load("YouAreABadGuy", "lang");
            this.badGuys = BdApi.Data.load("YouAreABadGuy", "badGuys") || {};
        } catch (e) {
            this.badGuys = {};
        }

        this.updateLanguage();

        try {
            BdApi.DOM.addStyle("bad-guy-style", `
                [data-is-marked-user="true"] [class*="username_"],
                [data-is-marked-user="true"] [class*="name_"],
                [data-is-marked-user="true"] [class*="nickname_"] {
                    color: #ff3333 !important;
                    text-shadow: 0 0 5px rgba(255, 0, 0, 0.8) !important;
                    font-weight: bold !important;
                    cursor: help !important;
                }
                #badguy-custom-tooltip {
                    position: fixed;
                    z-index: 2147483647 !important;
                    background-color: var(--background-floating, #111214);
                    color: var(--text-normal, #dbdee1);
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    box-shadow: 0 8px 16px rgba(0,0,0,0.24);
                    pointer-events: none;
                    visibility: hidden;
                    opacity: 0;
                    transition: opacity 0.1s ease-in-out;
                    transform: translate(-50%, -100%);
                    min-width: 200px;
                    max-width: 300px;
                    word-wrap: break-word;
                }
                #badguy-custom-tooltip .bg-title { font-weight: bold; color: #ff3333; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; }
                #badguy-custom-tooltip .bg-field { margin-bottom: 4px; }
                #badguy-custom-tooltip .bg-label { font-weight: 600; font-size: 12px; opacity: 0.7; }
                #badguy-custom-tooltip .bg-value { font-weight: 400; font-size: 13px; }
                #badguy-custom-tooltip::after {
                    content: "";
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -6px;
                    border-width: 6px;
                    border-style: solid;
                    border-color: var(--background-floating, #111214) transparent transparent transparent;
                }
                #badguy-custom-tooltip.visible {
                    visibility: visible;
                    opacity: 1;
                }
                .badguy-select {
                    width: 100%;
                    padding: 10px;
                    border-radius: 4px;
                    background-color: #1e1f22 !important;
                    color: #dbdee1 !important;
                    border: 1px solid #1e1f22;
                    outline: none;
                    font-family: inherit;
                    cursor: pointer;
                }
                .badguy-select option {
                    background-color: #1e1f22 !important;
                    color: #dbdee1 !important;
                    padding: 10px;
                }
            `);
        } catch (e) {}

        try {
            this.tooltipElement = document.createElement('div');
            this.tooltipElement.id = 'badguy-custom-tooltip';
            document.body.appendChild(this.tooltipElement);
        } catch (e) {}

        this.handleMouseOver = (e) => {
            try {
                const target = e.target.closest('[data-bg-id]');
                if (!target || !this.tooltipElement) return;
                
                const uId = target.getAttribute('data-bg-id');
                if (!uId || !this.badGuys[uId]) return;

                const record = this.badGuys[uId];
                
                this.tooltipElement.innerHTML = `
                    <div class="bg-title">Bad Guy</div>
                    <div class="bg-field"><span class="bg-label">${this.getString("reason")}:</span> <span class="bg-value">${record.reason || this.getString("none")}</span></div>
                    <div class="bg-field" style="margin-top: 8px; font-size: 11px; opacity: 0.5;">${this.getString("date")}: ${record.date}</div>
                `;
                
                const rect = target.getBoundingClientRect();
                this.tooltipElement.style.left = (rect.left + (rect.width / 2)) + 'px';
                this.tooltipElement.style.top = (rect.top - 8) + 'px';
                this.tooltipElement.classList.add('visible');
            } catch (err) {}
        };

        this.handleMouseOut = (e) => {
            try {
                if (!e.relatedTarget || !e.relatedTarget.closest('[data-bg-id]')) {
                    if (this.tooltipElement) {
                        this.tooltipElement.classList.remove('visible');
                    }
                }
            } catch (err) {}
        };

        try {
            document.addEventListener('mouseover', this.handleMouseOver, true);
            document.addEventListener('mouseout', this.handleMouseOut, true);
        } catch (e) {}

        try {
            this.menuPatch = BdApi.ContextMenu.patch("user-context", (res, props) => {
                try {
                    const userId = props?.user?.id;
                    if (!userId) return;

                    const isMarked = !!this.badGuys[userId];
                    const ce = BdApi.React.createElement;

                    const menuItem = BdApi.ContextMenu.buildItem({
                        type: "toggle",
                        label: isMarked ? this.getString("unmark") : this.getString("mark"),
                        checked: isMarked,
                        action: () => {
                            try {
                                if (isMarked) {
                                    delete this.badGuys[userId];
                                    BdApi.Data.save("YouAreABadGuy", "badGuys", this.badGuys);
                                    this.processAllElements();
                                } else {
                                    let gId = "";
                                    try {
                                        const guildModule = BdApi.Webpack.getModule(m => m && typeof m.getGuildId === "function");
                                        if (guildModule) gId = guildModule.getGuildId() || "";
                                    } catch(ex) {}

                                    const content = ce("div", {style: {display: "flex", flexDirection: "column", gap: "10px"}},
                                        ce("label", {style: {color: "var(--header-primary)", fontWeight: "bold"}}, this.getString("reason")),
                                        ce("textarea", {id: "bg-reason-input", style: {padding: "10px", borderRadius: "4px", border: "1px solid var(--background-tertiary)", background: "var(--input-background)", color: "var(--text-normal)", resize: "vertical", minHeight: "80px"}})
                                    );
                                    
                                    BdApi.UI.showConfirmationModal("Bad Guy", content, {
                                        confirmText: this.getString("save"),
                                        cancelText: this.getString("close"),
                                        onConfirm: () => {
                                            try {
                                                const newReason = document.getElementById("bg-reason-input").value;
                                                this.badGuys[userId] = {
                                                    date: new Date().toISOString().split('T')[0],
                                                    reason: newReason,
                                                    guildId: gId
                                                };
                                                BdApi.Data.save("YouAreABadGuy", "badGuys", this.badGuys);
                                                this.processAllElements();
                                            } catch(ex) {}
                                        }
                                    });

                                    setTimeout(() => {
                                        const reasonInput = document.getElementById("bg-reason-input");
                                        if (reasonInput) reasonInput.focus();
                                    }, 100);
                                }
                            } catch (err) {}
                        }
                    });

                    if (res?.props?.children) {
                        if (!Array.isArray(res.props.children)) {
                            res.props.children = [res.props.children];
                        }
                        res.props.children.push(BdApi.ContextMenu.buildItem({ type: "separator" }));
                        res.props.children.push(menuItem);
                    }
                } catch (err) {}
            });
        } catch (e) {}

        try {
            this.interval = setInterval(() => {
                this.processAllElements();
            }, 300);
        } catch (e) {}
    }

    updateLanguage() {
        this.currentLang = "en";
        if (this.customLang && this.strings[this.customLang]) {
            this.currentLang = this.customLang;
        } else {
            try {
                const localeModule = BdApi.Webpack.getModule(m => m && typeof m.getLocale === "function");
                if (localeModule) {
                    const sysLang = localeModule.getLocale().split("-")[0];
                    if (this.strings[sysLang]) this.currentLang = sysLang;
                }
            } catch(e) {}
        }
    }

    getString(key) {
        return this.strings[this.currentLang][key] || this.strings["en"][key] || key;
    }

    getSettingsPanel() {
        const panel = document.createElement("div");
        panel.style.padding = "20px";
        panel.style.color = "var(--text-normal)";

        const langLabel = document.createElement("div");
        langLabel.textContent = this.getString("lang");
        langLabel.style.fontWeight = "bold";
        langLabel.style.marginBottom = "8px";
        langLabel.style.color = "var(--header-primary)";
        panel.appendChild(langLabel);

        const langSelectWrapper = document.createElement("div");
        langSelectWrapper.style.position = "relative";
        langSelectWrapper.style.marginBottom = "24px";
        
        const langSelect = document.createElement("select");
        langSelect.className = "badguy-select";
        
        const langs = {en: "English", fr: "Français", de: "Deutsch", es: "Español", it: "Italiano", ru: "Русский"};
        for (const [code, name] of Object.entries(langs)) {
            const opt = document.createElement("option");
            opt.value = code;
            opt.textContent = name;
            if (code === this.currentLang) opt.selected = true;
            langSelect.appendChild(opt);
        }
        langSelect.onchange = (e) => {
            this.customLang = e.target.value;
            BdApi.Data.save("YouAreABadGuy", "lang", this.customLang);
            this.updateLanguage();
        };
        
        langSelectWrapper.appendChild(langSelect);
        panel.appendChild(langSelectWrapper);

        const divider = document.createElement("div");
        divider.style.height = "1px";
        divider.style.background = "var(--background-modifier-accent)";
        divider.style.marginBottom = "24px";
        panel.appendChild(divider);

        const exportLabel = document.createElement("div");
        exportLabel.textContent = this.getString("export");
        exportLabel.style.fontWeight = "bold";
        exportLabel.style.marginBottom = "8px";
        exportLabel.style.color = "var(--header-primary)";
        panel.appendChild(exportLabel);

        const guildSelectWrapper = document.createElement("div");
        guildSelectWrapper.style.position = "relative";
        guildSelectWrapper.style.marginBottom = "12px";

        const guildSelect = document.createElement("select");
        guildSelect.className = "badguy-select";
        
        const allOpt = document.createElement("option");
        allOpt.value = "all";
        allOpt.textContent = this.getString("allServers");
        guildSelect.appendChild(allOpt);

        const guildStore = BdApi.Webpack.getModule(m => m && typeof m.getGuilds === "function");
        if (guildStore) {
            const allGuilds = guildStore.getGuilds();
            const sortedGuilds = Object.values(allGuilds).sort((a, b) => a.name.localeCompare(b.name));
            
            sortedGuilds.forEach(g => {
                const opt = document.createElement("option");
                opt.value = g.id;
                opt.textContent = g.name;
                guildSelect.appendChild(opt);
            });
        }

        guildSelectWrapper.appendChild(guildSelect);
        panel.appendChild(guildSelectWrapper);

        const exportBtn = document.createElement("button");
        exportBtn.textContent = this.getString("exportBtn");
        exportBtn.className = "bd-button bd-button-filled bd-button-color-brand";
        exportBtn.style.marginBottom = "24px";
        exportBtn.onclick = () => {
            const selected = guildSelect.value;
            const dataToExport = {};
            for (const id in this.badGuys) {
                if (selected === "all" || this.badGuys[id].guildId === selected) {
                    dataToExport[id] = this.badGuys[id];
                }
            }
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {type: "application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `BadGuys_${selected}_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        };
        panel.appendChild(exportBtn);

        const divider2 = document.createElement("div");
        divider2.style.height = "1px";
        divider2.style.background = "var(--background-modifier-accent)";
        divider2.style.marginBottom = "24px";
        panel.appendChild(divider2);

        const importLabel = document.createElement("div");
        importLabel.textContent = this.getString("import");
        importLabel.style.fontWeight = "bold";
        importLabel.style.marginBottom = "8px";
        importLabel.style.color = "var(--header-primary)";
        panel.appendChild(importLabel);

        const importBtn = document.createElement("button");
        importBtn.textContent = this.getString("importBtn");
        importBtn.className = "bd-button bd-button-filled bd-button-color-green";
        importBtn.onclick = () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => {
                    try {
                        const parsed = JSON.parse(ev.target.result);
                        for (const id in parsed) {
                            this.badGuys[id] = parsed[id];
                        }
                        BdApi.Data.save("YouAreABadGuy", "badGuys", this.badGuys);
                        this.processAllElements();
                        BdApi.UI.showToast(this.getString("success"), {type: "success"});
                    } catch(err) {
                        BdApi.UI.showToast(this.getString("fail"), {type: "error"});
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        };
        panel.appendChild(importBtn);

        return panel;
    }

    getUserId(node) {
        try {
            const avatar = node.querySelector('img[src*="/avatars/"]');
            if (avatar) {
                const match = avatar.src.match(/\/avatars\/(\d+)\//);
                if (match && match[1]) return match[1];
            }

            const reactKey = Object.keys(node).find(k => k.startsWith("__reactFiber$"));
            if (!reactKey) return null;
            
            let current = node[reactKey];
            let depth = 0;
            
            while (current && depth < 15) {
                const props = current.memoizedProps;
                if (props) {
                    if (props.user?.id) return props.user.id;
                    if (props.message?.author?.id) return props.message.author.id;
                    if (props.userId && typeof props.userId === 'string') return props.userId;
                }
                current = current.return;
                depth++;
            }
        } catch (e) {}
        return null;
    }

    processAllElements() {
        try {
            const containers = document.querySelectorAll('li[class*="messageListItem_"], div[class*="message_"], div[class*="member_"], li[class*="member_"], div[class*="voiceUser_"], li[class*="voiceUser_"]');
            
            for (let i = 0; i < containers.length; i++) {
                const container = containers[i];
                const userId = this.getUserId(container);
                
                if (userId) {
                    const nameElements = container.querySelectorAll('[class*="username_"], [class*="name_"], [class*="nickname_"]');
                    
                    if (this.badGuys[userId]) {
                        if (container.getAttribute('data-is-marked-user') !== 'true') {
                            container.setAttribute('data-is-marked-user', 'true');
                        }
                        for (let j = 0; j < nameElements.length; j++) {
                            if (nameElements[j].getAttribute('data-bg-id') !== userId) {
                                nameElements[j].setAttribute('data-bg-id', userId);
                            }
                        }
                    } else {
                        if (container.hasAttribute('data-is-marked-user')) {
                            container.removeAttribute('data-is-marked-user');
                            for (let j = 0; j < nameElements.length; j++) {
                                nameElements[j].removeAttribute('data-bg-id');
                            }
                        }
                    }
                }
            }
        } catch (e) {}
    }

    stop() {
        try {
            if (this.interval) clearInterval(this.interval);
            
            if (this.handleMouseOver) document.removeEventListener('mouseover', this.handleMouseOver, true);
            if (this.handleMouseOut) document.removeEventListener('mouseout', this.handleMouseOut, true);
            
            if (this.tooltipElement) {
                this.tooltipElement.remove();
                this.tooltipElement = null;
            }

            BdApi.DOM.removeStyle("bad-guy-style");
            if (this.menuPatch) this.menuPatch();
            
            const containers = document.querySelectorAll('[data-is-marked-user="true"]');
            for (let i = 0; i < containers.length; i++) {
                containers[i].removeAttribute('data-is-marked-user');
                const nameElements = containers[i].querySelectorAll('[class*="username_"], [class*="name_"], [class*="nickname_"]');
                for (let j = 0; j < nameElements.length; j++) {
                    nameElements[j].removeAttribute('data-bg-id');
                }
            }
        } catch (e) {}
    }
};