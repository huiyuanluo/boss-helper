export const launchpadStyles = `
:host {
  all: initial;
  color: #303133;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
}

* {
  box-sizing: border-box;
}

p {
  margin: 0;
}

button,
input {
  font: inherit;
}

.bh-launchpad-shell {
  position: fixed;
  left: -100vw;
  top: 0;
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  min-width: 900px;
  min-height: 0;
  z-index: 100000;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(6px);
  transition: left 0.28s ease;
}

.bh-launchpad-shell[data-show="true"] {
  left: 0;
}

.bh-launchpad {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bh-launchpad::-webkit-scrollbar,
.bh-column-body::-webkit-scrollbar {
  display: none;
}

.bh-column-body {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.bh-header {
  width: 100%;
  height: 40px;
  flex: 0 0 40px;
  margin-top: 40px;
  padding: 0 40px;
  display: flex;
  align-items: center;
}

.bh-search {
  width: 46%;
  height: 40px;
  margin-left: 27%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #303133;
  padding: 0 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.bh-search:focus {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.14);
}

.bh-spacer {
  flex: 1;
}

.bh-close {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  color: #606266;
  background: transparent;
  cursor: pointer;
}

.bh-close:hover {
  color: #409eff;
}

.bh-content {
  width: 100%;
  height: auto;
  min-height: 0;
  flex: 1 1 auto;
  margin-top: 20px;
  margin-bottom: 20px;
  display: flex;
  overflow: hidden;
}

.bh-column {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.bh-column-all,
.bh-column-side {
  width: 20%;
  height: 100%;
  min-height: 0;
  margin-left: 3.5%;
  margin-right: 3.5%;
}

.bh-column-search {
  width: 46%;
  height: 100%;
  min-height: 0;
}

.bh-column-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.bh-column-side .bh-column {
  min-height: 0;
  flex: 1 1 0;
}

.bh-title {
  width: 100%;
  height: 35px;
  flex: 0 0 35px;
  padding-left: 10px;
  line-height: 35px;
  font-size: 18px;
  color: #606266;
  position: relative;
}

.bh-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 8.5px;
  width: 3px;
  height: 18px;
  background-color: #409eff;
  border-radius: 2px;
}

.bh-column-body {
  width: 100%;
  height: auto;
  min-height: 0;
  flex: 1 1 auto;
  overflow-y: auto;
  border: 1px solid #dddfe6;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.bh-row {
  min-height: 36px;
  padding: 5px 4px 5px 9px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #303133;
  font-size: 14px;
}

.bh-row:hover {
  background: #ecf5ff;
}

.bh-row-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bh-tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  margin-left: 6px;
  padding: 0 6px;
  border: 1px solid #e1f3d8;
  border-radius: 4px;
  color: #67c23a;
  background: #f0f9eb;
  font-size: 12px;
  line-height: 18px;
  vertical-align: middle;
}

.bh-row-action {
  width: 30px;
  height: 30px;
  display: none;
  flex: none;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #409eff;
  cursor: pointer;
}

.bh-row-action svg {
  width: 22px;
  height: 22px;
}

.bh-row:hover .bh-row-action {
  display: inline-flex;
}

.bh-empty {
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
`
