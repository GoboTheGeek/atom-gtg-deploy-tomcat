'use babel';
const fs = require('fs');
const path = require('path');

import GtgDeployTomcatView from './gtg-deploy-tomcat-view';
import { CompositeDisposable } from 'atom';

export default {

  gtgDeployTomcatView: null,
  modalPanel: null,
  subscriptions: null,
  state: false,

  activate(state) {
    this.gtgDeployTomcatView = new GtgDeployTomcatView(state.gtgDeployTomcatViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.gtgDeployTomcatView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'gtg-deploy-tomcat:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.gtgDeployTomcatView.destroy();
  },

  serialize() {
    return {
      gtgDeployTomcatViewState: this.gtgDeployTomcatView.serialize()
    };
  },

  toggle() {
      let folderSrc;
      let folderDst;
      let descDeplFilename;
      let fileDepl;
      let descRead;
      let descContent;

      console.log('GtgDeployTomcat was toggled!');
      this.state = !this.state;

      // we proceed only when panel is visible.
      if (this.state) {
          try {
              folderSrc = atom.project.getDirectories()[0].path;
              // build filename to descriptor file
              descDeplFilename = folderSrc + '/gtg-deployment.json';
              if (!fs.existsSync(descDeplFilename)) {
                  // if file doesn't exist, game over boy
                  this.gtgDeployTomcatView.displayMessage('No descriptor file to deploy to tomcat.', 'gtg-message-error');
                  // missing close button
              } else {
                  /// open descriptor file
                  fileDepl = new File([ descDeplFilename ], false);
                  // read json file content
                  descRead = fs.readFileSync(descDeplFilename);
                  try {
                      descContent = JSON.parse(descRead.toString());
                      if ((null != descContent) && (null != descContent.destination)) {
                          folderDst = descContent.destination;
                          this.gtgDeployTomcatView.displayMessage('Deploying files from [' + folderSrc + '] to [' + folderDst + ']', 'gtg-message-info');
                          this._deployContent(folderSrc, folderDst, ((null != descContent.purge) && descContent.purge));
                          console.log('GtgDeployTomcat wil deploy files from [' + folderSrc + '] to [' + folderDst + ']');
                      } else {
                          this.gtgDeployTomcatView.displayMessage('JSON format is { "destination": "folder", "purge": "true" }', 'gtg-message-error');
                      }
                  } catch (ej) {
                      this.gtgDeployTomcatView.displayMessage('descriptor file is not JSON compliant.', 'gtg-message-error');
                      console.error(ej);
                  }
              }
          } catch (e) {
              console.error(e);
              this.gtgDeployTomcatView.displayMessage('Unable to access filesystem.', 'gtg-message-error');
          }
      }
      return (this.modalPanel.isVisible() ? this.modalPanel.hide() : this.modalPanel.show() );
  },

  // remove content of folderDst if clean is true
  // copy content of folderSrc to folderDst
  _deployContent(folderSrc, folderDst, clean) {
      let filesSrc;

      if (clean && fs.existsSync(folderDst) && fs.lstatSync(folderDst).isDirectory()) {
          //fs.rmdirSync(folderDst, { recursive: true } );
          this._deleteRecursive(folderDst);
      }
      if (!fs.existsSync(folderDst)) {
          fs.mkdirSync(folderDst);
      }
      this._copyRecursive(folderSrc, folderDst);
  },

  _deleteRecursive(path) {
      let thiz = this;
      let files = [];
      let curPath;

      if (fs.existsSync(path)) {
          files = fs.readdirSync(path);
          files.forEach(function(file, index) {
              curPath = path + "/" + file;
              if (fs.lstatSync(curPath).isDirectory()) {
                  thiz._deleteRecursive(curPath);
              } else {
                  fs.unlinkSync(curPath);
              }
          } );
          fs.rmdirSync(path);
      }
  },

  _copyRecursive(folderSrc, folderDst) {
      let thiz = this;
      let fileSrc;
      let fileDst;

      fs.readdir(folderSrc, function (err, files) {
          if (err) {
              return console.log('Unable to scan directory: ' + err);
          }
          files.forEach(function (file) {
              if ('gtg-deployment.json' !== file) {
                  fileSrc = path.join(folderSrc, file);
                  fileDst = path.join(folderDst, file);
                  if (fs.lstatSync(fileSrc).isDirectory()) {
                      fs.mkdirSync(fileDst);
                      thiz._copyRecursive(fileSrc, fileDst);
                  } else {
                      fs.copyFileSync(fileSrc, fileDst);
                  }
              }
          } );
      } );
  }
};
