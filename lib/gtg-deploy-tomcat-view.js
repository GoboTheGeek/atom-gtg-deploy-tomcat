'use babel';

export default class GtgDeployTomcatView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('gtg-deploy-tomcat');
    this.nodeMsg = null;
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  displayMessage(msg, css) {
      const message = document.createElement('div');
      message.classList.add('gtg-message');
      message.textContent = msg;
      message.classList.add(css);
      if (null != this.nodeMsg) {
          this.element.removeChild(this.nodeMsg);
      }
      this.nodeMsg = this.element.appendChild(message);
  }
}
