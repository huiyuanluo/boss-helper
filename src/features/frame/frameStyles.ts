export const frameGlobalStyles = `
html.boss-helper-frame-enhanced,
html.boss-helper-frame-enhanced body {
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
}

html.boss-helper-frame-enhanced body > .header {
  display: none !important;
}

html.boss-helper-frame-enhanced body > .content {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  overflow: hidden !important;
  background: #f6f8fb !important;
}

html.boss-helper-frame-enhanced .dl-main-nav,
html.boss-helper-frame-enhanced #J_Nav,
html.boss-helper-frame-enhanced .dl-hide-list,
html.boss-helper-frame-enhanced .nav-search-container {
  display: none !important;
}

html.boss-helper-frame-enhanced #J_NavContent {
  position: fixed !important;
  top: var(--boss-helper-frame-top, 0px) !important;
  left: var(--boss-helper-frame-left, 300px) !important;
  right: 0 !important;
  bottom: 0 !important;
  width: auto !important;
  height: auto !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  background: #ffffff !important;
  z-index: 99980 !important;
  transition: left 0.22s ease !important;
}

html.boss-helper-frame-enhanced #J_NavContent > .dl-tab-item {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  list-style: none !important;
  overflow: hidden !important;
}

html.boss-helper-frame-enhanced #J_NavContent > .dl-tab-item.ks-hidden {
  display: none !important;
}

html.boss-helper-frame-enhanced #J_NavContent .dl-second-nav {
  display: none !important;
}

html.boss-helper-frame-enhanced #J_NavContent .dl-inner-tab {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

html.boss-helper-frame-enhanced #J_NavContent .bui-nav-tab {
  width: 100% !important;
  height: 100% !important;
  display: block !important;
  border: 0 !important;
  background: #ffffff !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-bar {
  position: relative !important;
  height: 38px !important;
  box-sizing: border-box !important;
  overflow: hidden !important;
  border-bottom: 1px solid #dbe3ee !important;
  background: #f7f9fc !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-wrapper,
html.boss-helper-frame-enhanced #J_NavContent .tab-nav-inner {
  height: 38px !important;
  box-sizing: border-box !important;
  background: none !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-wrapper {
  margin: 0 34px !important;
  overflow: hidden !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-inner {
  margin: 0 !important;
  overflow-x: auto !important;
  overflow-y: hidden !important;
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-inner::-webkit-scrollbar {
  display: none !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-list {
  width: max-content !important;
  min-width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 5px 8px !important;
  box-sizing: border-box !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  list-style: none !important;
  white-space: nowrap !important;
  background: none !important;
}

html.boss-helper-frame-enhanced #J_NavContent .bui-nav-tab-item {
  width: fit-content !important;
  min-width: 92px !important;
  max-width: 190px !important;
  height: 28px !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  padding: 0 !important;
  flex: 0 0 auto !important;
  display: inline-flex !important;
  align-items: center !important;
  position: relative !important;
  overflow: visible !important;
  list-style: none !important;
  color: #53657a !important;
  background: none !important;
  border: 0 !important;
  cursor: pointer !important;
  z-index: 1 !important;
  transition: color 0.16s ease, transform 0.16s ease !important;
}

html.boss-helper-frame-enhanced #J_NavContent .bui-nav-tab-item:hover {
  color: #24364a !important;
  transform: translateY(-1px) !important;
}

html.boss-helper-frame-enhanced #J_NavContent .bui-nav-tab-item.tab-nav-actived {
  color: #155f98 !important;
  z-index: 2 !important;
}

html.boss-helper-frame-enhanced #J_NavContent .bui-nav-tab-item .l,
html.boss-helper-frame-enhanced #J_NavContent .bui-nav-tab-item .r {
  display: none !important;
  background: none !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-item-inner {
  width: auto !important;
  min-width: 92px !important;
  max-width: 190px !important;
  height: 28px !important;
  box-sizing: border-box !important;
  margin: 0 !important;
  padding: 0 30px 0 11px !important;
  position: relative !important;
  display: flex !important;
  align-items: center !important;
  border: 1px solid #d8e1ec !important;
  border-radius: 8px !important;
  background: #eef3f8 !important;
  box-shadow: none !important;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease !important;
}

html.boss-helper-frame-enhanced #J_NavContent .bui-nav-tab-item:hover .tab-item-inner {
  background: #e8f0f8 !important;
  border-color: #c8d6e6 !important;
}

html.boss-helper-frame-enhanced #J_NavContent .bui-nav-tab-item.tab-nav-actived .tab-item-inner {
  background: #ffffff !important;
  border-color: #bed8ef !important;
  box-shadow: 0 1px 5px rgba(30, 51, 78, 0.1) !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-item-title {
  min-width: 0 !important;
  max-width: 142px !important;
  display: block !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  color: inherit !important;
  font-size: 12px !important;
  font-weight: 650 !important;
  line-height: 26px !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-item-close {
  position: absolute !important;
  top: 50% !important;
  right: 6px !important;
  left: auto !important;
  width: 18px !important;
  height: 18px !important;
  margin: 0 !important;
  border-radius: 6px !important;
  overflow: hidden !important;
  color: #8a98a8 !important;
  background: transparent !important;
  cursor: pointer !important;
  transform: translateY(-50%) !important;
  transition: background-color 0.14s ease, color 0.14s ease, transform 0.14s ease !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-item-close::before,
html.boss-helper-frame-enhanced #J_NavContent .tab-item-close::after {
  content: "" !important;
  position: absolute !important;
  left: 4px !important;
  top: 8px !important;
  width: 10px !important;
  height: 1.5px !important;
  border-radius: 999px !important;
  background: currentColor !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-item-close::before {
  transform: rotate(45deg) !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-item-close::after {
  transform: rotate(-45deg) !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-item-close:hover {
  color: #b42318 !important;
  background: #fee4e2 !important;
  transform: translateY(-50%) scale(1.04) !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-arrow {
  position: absolute !important;
  top: 7px !important;
  width: 24px !important;
  height: 24px !important;
  border-radius: 7px !important;
  display: block !important;
  overflow: hidden !important;
  color: #64748b !important;
  background: transparent !important;
  cursor: pointer !important;
  z-index: 3 !important;
  transition: background-color 0.16s ease, color 0.16s ease !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-arrow:hover {
  color: #155f98 !important;
  background: #e7f1fb !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-arrow.arrow-left {
  left: 6px !important;
  right: auto !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-arrow.arrow-right {
  right: 6px !important;
  left: auto !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-arrow::before {
  content: "" !important;
  position: absolute !important;
  top: 8px !important;
  width: 7px !important;
  height: 7px !important;
  border-top: 1.5px solid currentColor !important;
  border-right: 1.5px solid currentColor !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-arrow.arrow-left::before {
  left: 9px !important;
  transform: rotate(-135deg) !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-nav-arrow.arrow-right::before {
  right: 9px !important;
  transform: rotate(45deg) !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-content-container {
  height: calc(100% - 38px) !important;
  overflow: hidden !important;
  background: #ffffff !important;
}

html.boss-helper-frame-enhanced #J_NavContent .tab-content,
html.boss-helper-frame-enhanced #J_NavContent iframe {
  width: 100% !important;
  height: 100% !important;
}
`

export const frameAppStyles = `
:host {
  all: initial;
  color: #1f2a37;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  --bh-primary: #1b6fae;
  --bh-primary-soft: #eef6ff;
  --bh-primary-line: #bed8ef;
  --bh-text: #1f2a37;
  --bh-muted: #607086;
  --bh-subtle: #909bad;
  --bh-border: #dbe3ee;
  --bh-border-strong: #cbd6e3;
  --bh-panel: #ffffff;
  --bh-bg: #f6f8fb;
  --bh-row-hover: #f3f7fb;
  --bh-row-active: #ffffff;
  --bh-shadow-soft: 0 1px 5px rgba(30, 51, 78, 0.08);
  --bh-green: #25845a;
  --bh-green-soft: #e8f6ef;
  --bh-orange: #a35c00;
  --bh-orange-soft: #fff4df;
}

* {
  box-sizing: border-box;
}

button,
input,
a {
  font: inherit;
}

button {
  border: 0;
}

p {
  margin: 0;
}

.bh-frame-shell {
  position: fixed;
  inset: 0;
  z-index: 100000;
  pointer-events: none;
  color: var(--bh-text);
}

.bh-toast {
  position: fixed;
  top: 12px;
  left: calc(var(--bh-left-width) + (100vw - var(--bh-left-width)) / 2);
  max-width: min(360px, calc(100vw - var(--bh-left-width) - 32px));
  min-height: 34px;
  padding: 8px 13px;
  border: 1px solid #c8d6e6;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.96);
  color: #203348;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  transform: translateX(-50%);
  font-size: 12px;
  font-weight: 750;
  line-height: 18px;
  animation: bh-toast-in 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}

.bh-toast[data-type="success"] {
  border-color: #b7dccb;
  color: #14543a;
  background: rgba(245, 253, 249, 0.97);
}

.bh-toast[data-type="error"] {
  border-color: #f4b9b3;
  color: #8a241c;
  background: rgba(255, 248, 247, 0.97);
}

@keyframes bh-toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-6px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.bh-left-shell {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: var(--bh-left-width);
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  background: #f9fbfe;
  border-right: 1px solid var(--bh-border);
  box-shadow: 1px 0 0 rgba(15, 23, 42, 0.04);
  transition: width 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.bh-left-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
}

.bh-module-column,
.bh-page-column {
  pointer-events: auto;
}

.bh-module-column {
  width: var(--bh-module-width);
  min-width: var(--bh-module-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fbff;
  border-right: 1px solid var(--bh-border);
  overflow: hidden;
  transition:
    width 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    min-width 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.bh-module-column[data-collapsed="true"] {
  align-items: center;
}

.bh-page-column {
  width: var(--bh-page-width);
  min-width: var(--bh-page-width);
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bh-panel);
  border-right: 1px solid var(--bh-border);
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}

.bh-user {
  min-height: 42px;
  flex: 0 0 42px;
  padding: 6px 8px 6px 10px;
  border-bottom: 1px solid var(--bh-border);
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
}

.bh-avatar {
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: 7px;
  background: var(--bh-primary-soft);
  color: var(--bh-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.bh-user-name {
  min-width: 0;
  flex: 1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
  line-height: 18px;
}

.bh-logout {
  min-width: 34px;
  height: 26px;
  flex: 0 0 auto;
  padding: 0 8px;
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--bh-muted);
  text-decoration: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  font-weight: 750;
  line-height: 18px;
}

.bh-logout:hover {
  color: var(--bh-primary);
  background: var(--bh-primary-soft);
}

.bh-restore {
  width: 30px;
  height: 30px;
  margin-top: 10px;
  border-radius: 8px;
  color: var(--bh-primary);
  background: var(--bh-primary-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.16s ease, transform 0.16s ease;
}

.bh-restore:hover {
  transform: translateX(1px);
  background: #dcecff;
}

.bh-panel-head {
  min-height: 58px;
  flex: 0 0 auto;
  padding: 8px 8px 8px;
  border-bottom: 1px solid var(--bh-border);
}

.bh-module-head {
  min-height: 38px;
  padding: 8px 8px 7px;
}

.bh-page-head {
  min-height: 38px;
  padding: 8px 8px 7px;
}

.bh-heading-row {
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.bh-heading {
  min-width: 0;
  font-size: 12px;
  font-weight: 800;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bh-heading-count {
  flex: 0 0 auto;
  color: var(--bh-subtle);
  font-size: 12px;
  line-height: 18px;
}

.bh-icon-button {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  border-radius: 7px;
  color: var(--bh-muted);
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.bh-icon-button:hover {
  color: var(--bh-primary);
  background: var(--bh-primary-soft);
  transform: translateX(-1px);
}

.bh-icon-button:disabled,
.bh-module-row:disabled,
.bh-page-row[data-disabled="true"],
.bh-page-copy:disabled,
.bh-open-close:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.bh-search-wrap {
  position: relative;
  margin-top: 8px;
}

.bh-search-icon {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bh-subtle);
  pointer-events: none;
}

.bh-search {
  width: 100%;
  height: 28px;
  border: 1px solid var(--bh-border);
  border-radius: 8px;
  background: #ffffff;
  color: var(--bh-text);
  outline: none;
  padding: 0 28px 0 28px;
  font-size: 12px;
  box-shadow: 0 1px 1px rgba(15, 23, 42, 0.03);
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background-color 0.16s ease;
}

.bh-search:focus {
  border-color: var(--bh-primary);
  box-shadow: 0 0 0 2px rgba(22, 119, 210, 0.13);
}

.bh-search-clear {
  position: absolute;
  right: 5px;
  top: 50%;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  transform: translateY(-50%);
  color: #7a8797;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.14s ease, color 0.14s ease, transform 0.14s ease;
}

.bh-search-clear:hover {
  color: var(--bh-primary);
  background: var(--bh-primary-soft);
  transform: translateY(-50%) scale(1.04);
}

.bh-search-clear:active {
  transform: translateY(-50%) scale(0.96);
}

.bh-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.bh-scroll::-webkit-scrollbar {
  display: none;
}

.bh-module-list,
.bh-group-list {
  padding: 6px;
}

.bh-module-row,
.bh-page-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0;
  text-align: left;
  cursor: pointer;
  background: transparent;
  color: var(--bh-text);
  border: 1px solid transparent;
  position: relative;
  isolation: isolate;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.bh-module-row {
  min-height: 32px;
  padding: 6px 8px 6px 12px;
  border-radius: 8px;
}

.bh-module-row::before,
.bh-page-row::before {
  content: "";
  position: absolute;
  left: 0;
  top: 7px;
  bottom: 7px;
  width: 3px;
  border-radius: 999px;
  background: var(--bh-primary);
  opacity: 0;
  transform: translateX(-2px) scaleY(0.5);
  transition: opacity 0.16s ease, transform 0.16s ease, background-color 0.16s ease;
  z-index: 1;
}

.bh-module-row:hover,
.bh-page-row:hover {
  background: var(--bh-row-hover);
  transform: translateX(2px);
}

.bh-module-row[data-selected="true"],
.bh-page-row[data-active="true"],
.bh-module-row[data-current="true"] {
  background: #eef6ff;
  border-color: transparent;
  color: #145f99;
  box-shadow: inset 0 0 0 1px rgba(27, 111, 174, 0.08);
}

.bh-module-row[data-selected="true"]::before,
.bh-page-row[data-active="true"]::before,
.bh-module-row[data-current="true"]::before {
  opacity: 1;
  background: #1b6fae;
  transform: translateX(0) scaleY(1);
}

.bh-module-row[data-selected="true"]:hover,
.bh-page-row[data-active="true"]:hover,
.bh-module-row[data-current="true"]:hover {
  background: #e4f1ff;
  transform: translateX(1px);
}

.bh-module-name,
.bh-page-title,
.bh-group-title {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.bh-module-name {
  min-width: 0;
  flex: 1;
  font-size: 12px;
  font-weight: 650;
  line-height: 18px;
}

.bh-module-row[data-selected="true"] .bh-module-name,
.bh-module-row[data-current="true"] .bh-module-name {
  color: #145f99;
  font-weight: 800;
}

.bh-group {
  padding-bottom: 7px;
}

.bh-group + .bh-group {
  padding-top: 1px;
}

.bh-group-title {
  width: 100%;
  min-height: 31px;
  padding: 6px 5px 6px 2px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #3b4f64;
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left;
  font-size: 12px;
  font-weight: 800;
  line-height: 18px;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.bh-group-title:hover {
  background: #f8fafc;
  border-color: transparent;
  transform: translateX(1px);
}

.bh-group[data-expanded="true"] .bh-group-title {
  background: #f7fafc;
  border-color: transparent;
  color: #203348;
  box-shadow: none;
}

.bh-group-chevron {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border-radius: 6px;
  color: #718096;
  background: #f1f5f9;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease, color 0.16s ease, background-color 0.16s ease;
}

.bh-group-title:hover .bh-group-chevron,
.bh-group[data-expanded="true"] .bh-group-chevron {
  color: #1b6fae;
  background: #e8f2fb;
}

.bh-group[data-expanded="true"] .bh-group-chevron {
  transform: rotate(90deg);
}

.bh-group-name {
  min-width: 0;
  flex: 1;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.bh-group-count {
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: #f1f5f9;
  font-size: 11px;
  font-weight: 800;
}

.bh-group[data-expanded="true"] .bh-group-count {
  color: #1b6fae;
  background: #e8f2fb;
}

.bh-group-items {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transform: translateY(-3px);
  transition:
    grid-template-rows 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s ease,
    transform 0.18s ease;
}

.bh-group[data-expanded="true"] .bh-group-items {
  grid-template-rows: 1fr;
  opacity: 1;
  transform: translateY(0);
}

.bh-group-items-inner {
  min-height: 0;
  overflow: hidden;
  padding-top: 0;
}

.bh-group[data-expanded="true"] .bh-group-items-inner {
  padding-top: 5px;
}

.bh-page-row {
  min-height: 34px;
  padding: 6px 4px 6px 13px;
  border-radius: 8px;
}

.bh-page-body {
  min-width: 0;
  flex: 1;
}

.bh-page-title {
  color: #516276;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.bh-page-tag {
  height: 16px;
  margin-left: 5px;
  padding: 0 4px;
  border: 1px solid #d8e1ec;
  border-radius: 5px;
  color: #6b7c8f;
  background: #f6f8fb;
  display: inline-flex;
  align-items: center;
  vertical-align: 1px;
  font-size: 10px;
  font-weight: 800;
  line-height: 14px;
}

.bh-page-row:hover .bh-page-title {
  color: #314459;
}

.bh-page-row[data-active="true"] .bh-page-title {
  color: #145f99;
  font-weight: 800;
}

.bh-page-row[data-active="true"] .bh-page-tag {
  border-color: #b9d5ed;
  color: #145f99;
  background: #e8f2fb;
}

.bh-row-spinner {
  flex: 0 0 auto;
  margin-left: 6px;
  color: var(--bh-primary);
}

.bh-page-copy {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  margin-left: 4px;
  border-radius: 7px;
  color: #7b8a9c;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateX(2px);
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    opacity 0.16s ease,
    transform 0.16s ease;
}

.bh-page-row:hover .bh-page-copy,
.bh-page-row:focus-within .bh-page-copy {
  opacity: 1;
  transform: translateX(0);
}

.bh-page-copy:hover {
  color: var(--bh-primary);
  background: rgba(27, 111, 174, 0.1);
}

.bh-page-row[data-active="true"] .bh-page-copy {
  color: #417baa;
}

.bh-page-row[data-active="true"] .bh-page-copy:hover {
  color: #145f99;
  background: rgba(27, 111, 174, 0.12);
}

.bh-section-title {
  padding: 0 2px 5px;
  color: var(--bh-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 17px;
}

.bh-open-section {
  flex: 0 0 auto;
  max-height: 34%;
  padding: 8px 6px;
  border-bottom: 1px solid var(--bh-border);
  overflow: hidden;
}

.bh-open-list {
  max-height: calc(34vh - 82px);
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.bh-open-list::-webkit-scrollbar {
  display: none;
}

.bh-recent-section {
  flex: 0 0 auto;
  max-height: 178px;
  padding: 8px 6px;
  border-bottom: 1px solid var(--bh-border);
  overflow: hidden;
}

.bh-module-search-section {
  flex: 0 0 auto;
  padding: 8px 6px;
  border-bottom: 1px solid var(--bh-border);
}

.bh-page-search-section {
  flex: 0 0 auto;
  padding: 8px 6px;
  border-bottom: 1px solid var(--bh-border);
}

.bh-module-search-section .bh-search-wrap,
.bh-page-search-section .bh-search-wrap {
  margin-top: 0;
}

.bh-page-recent-section {
  flex: 0 0 auto;
  max-height: 198px;
  padding: 8px 6px;
  border-bottom: 1px solid var(--bh-border);
  overflow: hidden;
}

.bh-page-recent-head {
  width: 100%;
  height: 22px;
  padding: 0 2px;
  border-radius: 7px;
  color: var(--bh-muted);
  background: transparent;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.bh-page-recent-head:hover {
  color: var(--bh-primary);
  background: #eef6ff;
}

.bh-page-recent-head .bh-section-title {
  padding: 0;
  line-height: 20px;
}

.bh-page-recent-chevron {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease;
}

.bh-page-recent-section[data-collapsed="false"] .bh-page-recent-chevron {
  transform: rotate(90deg);
}

.bh-page-recent-list {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition:
    grid-template-rows 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s ease;
}

.bh-page-recent-section[data-collapsed="true"] .bh-page-recent-list {
  grid-template-rows: 0fr;
  opacity: 0;
}

.bh-page-recent-list-inner {
  min-height: 0;
  max-height: 156px;
  padding-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.bh-page-recent-list-inner::-webkit-scrollbar {
  display: none;
}

.bh-page-recent-item {
  width: 100%;
  min-height: 27px;
  padding: 3px 4px 3px 9px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #4d5f73;
  display: flex;
  align-items: center;
  gap: 4px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.bh-page-recent-item:hover {
  color: #203348;
  background: #f2f6fb;
  transform: translateX(1px);
}

.bh-page-recent-item[data-active="true"] {
  color: #145f99;
  background: #eef6ff;
}

.bh-page-recent-item[data-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.52;
}

.bh-page-recent-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 650;
  line-height: 18px;
}

.bh-page-recent-delete {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 6px;
  color: #8a98a8;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateX(2px);
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    opacity 0.16s ease,
    transform 0.16s ease;
}

.bh-page-recent-item:hover .bh-page-recent-delete,
.bh-page-recent-item:focus-within .bh-page-recent-delete {
  opacity: 1;
  transform: translateX(0);
}

.bh-page-recent-delete:hover {
  color: #b42318;
  background: #fee4e2;
}

.bh-recent-head {
  width: 100%;
  height: 22px;
  padding: 0 2px;
  border-radius: 7px;
  color: var(--bh-muted);
  background: transparent;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease;
}

.bh-recent-head:hover {
  color: var(--bh-primary);
  background: #eef6ff;
}

.bh-recent-head .bh-section-title {
  padding: 0;
  line-height: 20px;
}

.bh-recent-chevron {
  width: 16px;
  height: 16px;
  flex: 0 0 16px;
  border-radius: 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.18s ease;
}

.bh-recent-section[data-collapsed="false"] .bh-recent-chevron {
  transform: rotate(90deg);
}

.bh-recent-list {
  display: grid;
  grid-template-rows: 1fr;
  opacity: 1;
  transition:
    grid-template-rows 0.2s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s ease;
}

.bh-recent-section[data-collapsed="true"] .bh-recent-list {
  grid-template-rows: 0fr;
  opacity: 0;
}

.bh-recent-list-inner {
  min-height: 0;
  padding-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.bh-recent-module {
  width: 100%;
  min-height: 27px;
  padding: 3px 4px 3px 10px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: #4d5f73;
  display: flex;
  align-items: center;
  gap: 4px;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.bh-recent-module:hover {
  color: #203348;
  background: #f2f6fb;
  transform: translateX(1px);
}

.bh-recent-module[data-active="true"] {
  color: #145f99;
  background: #eef6ff;
}

.bh-recent-module[data-disabled="true"] {
  cursor: not-allowed;
  opacity: 0.52;
}

.bh-recent-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 650;
  line-height: 18px;
}

.bh-recent-delete {
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  border-radius: 6px;
  color: #8a98a8;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transform: translateX(2px);
  transition:
    background-color 0.16s ease,
    color 0.16s ease,
    opacity 0.16s ease,
    transform 0.16s ease;
}

.bh-recent-module:hover .bh-recent-delete,
.bh-recent-module:focus-within .bh-recent-delete {
  opacity: 1;
  transform: translateX(0);
}

.bh-recent-delete:hover {
  color: #b42318;
  background: #fee4e2;
}

.bh-open-module {
  width: 100%;
  min-height: 30px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #ffffff;
  color: var(--bh-text);
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 5px 4px 9px;
  cursor: pointer;
  position: relative;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.bh-open-module::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 8px;
  bottom: 8px;
  width: 2px;
  border-radius: 999px;
  background: var(--bh-primary);
  opacity: 0;
  transform: scaleY(0.35);
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.bh-open-module:hover {
  background: var(--bh-row-hover);
  transform: translateX(2px);
}

.bh-open-module[tabindex="-1"] {
  cursor: wait;
  opacity: 0.72;
}

.bh-open-module[data-active="true"] {
  border-color: var(--bh-primary-line);
  background: #ffffff;
  color: #115b9f;
  box-shadow: var(--bh-shadow-soft);
}

.bh-open-module[data-active="true"]::before {
  opacity: 1;
  transform: scaleY(1);
}

.bh-open-name {
  min-width: 0;
  flex: 1;
  overflow-wrap: anywhere;
  word-break: break-word;
  font-size: 12px;
  font-weight: 750;
  line-height: 16px;
}

.bh-open-close {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  flex: 0 0 24px;
  color: var(--bh-muted);
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.78;
  transition: background-color 0.16s ease, color 0.16s ease, opacity 0.16s ease;
}

.bh-open-close:hover {
  color: #c03221;
  background: #feeae7;
  opacity: 1;
}

.bh-empty,
.bh-loading {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  text-align: center;
  color: var(--bh-subtle);
  font-size: 12px;
  line-height: 18px;
}

.bh-open-empty {
  height: 28px;
  display: flex;
  align-items: center;
  padding: 0 6px;
  color: var(--bh-subtle);
  font-size: 12px;
}

.bh-spin {
  animation: bh-spin 0.85s linear infinite;
}

@keyframes bh-spin {
  to {
    transform: rotate(360deg);
  }
}
`
