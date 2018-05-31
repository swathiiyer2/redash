import React from 'react';
import PropTypes from 'prop-types';
import { map } from 'lodash';

import AceEditor from 'react-ace';
import ace from 'brace';

import 'brace/ext/language_tools';
import 'brace/mode/json';
import 'brace/mode/python';
import 'brace/mode/sql';
import 'brace/theme/monokai';

const langTools = ace.acequire('ace/ext/language_tools');
const snippetsModule = ace.acequire('ace/snippets');

// By default Ace will try to load snippet files for the different modes and fail.
// We don't need them, so we use these placeholders until we define our own.
function defineDummySnippets(mode) {
  ace.define(`ace/snippets/${mode}`, ['require', 'exports', 'module'], (require, exports) => {
    exports.snippetText = '';
    exports.scope = mode;
  });
}

defineDummySnippets('python');
defineDummySnippets('sql');
defineDummySnippets('json');

function buildKeywordsFromSchema(schema) {
  const keywords = {};
  schema.forEach((table) => {
    keywords[table.name] = 'Table';

    table.columns.forEach((c) => { // autoCompleteColumns
      if (c.charAt(c.length - 1) === ')') {
        let parensStartAt = c.indexOf('(') - 1;
        c = c.substring(0, parensStartAt);
        parensStartAt = 1; // linter complains without this line
      }
      // remove '[P] ' for partition keys
      if (c.charAt(0) === '[') {
        c = c.substring(4, c.length);
      }
      // keywords[c] = 'Column'; // dups columns
      keywords[`${table.name}.${c}`] = 'Column';
    });
  });

  return map(keywords, (v, k) =>
    ({
      name: k,
      value: k,
      score: 0,
      meta: v,
    }));
}

export default class QueryEditor extends React.Component {
  static propTypes = {
    queryText: PropTypes.string.isRequired,
    autocompleteQuery: PropTypes.bool, // eslint-disable-line react/no-unused-prop-types
    schema: PropTypes.array, // eslint-disable-line react/no-unused-prop-types
    syntax: PropTypes.string,
    dataSources: PropTypes.array,
    dataSource: PropTypes.object,
    isQueryOwner: PropTypes.bool.isRequired,
    updateDataSource: PropTypes.func.isRequired,
    canExecuteQuery: PropTypes.func.isRequired,
    executeQuery: PropTypes.func.isRequired,
    saveQuery: PropTypes.func.isRequired,
    updateQuery: PropTypes.func.isRequired,
    listenForResize: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
  }

  static defaultProps = {
    syntax: 'sql',
    autocompleteQuery: false,
    schema: null,
    dataSource: { options: { doc: '' } },
    dataSources: [],
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (!nextProps.schema) {
      return { ...prevState, keywords: [], autocompleteQuery: false };
    } else if (nextProps.schema !== prevState.schema) {
      return {
        ...prevState,
        schema: nextProps.schema,
        keywords: buildKeywordsFromSchema(nextProps.schema),
        autocompleteQuery: (nextProps.schema.reduce((totalLength, table) =>
          totalLength + table.columns.length, 0) <= 5000 && nextProps.autocompleteQuery),
      };
    }
    return prevState;
  }

  constructor(props) {
    super(props);
    this.refEditor = React.createRef();
    this.state = {
      schema: null, // eslint-disable-line react/no-unused-state
      keywords: [], // eslint-disable-line react/no-unused-state
      autocompleteQuery: false,
      queryExecuting: false,
      queryText: this.props.queryText,
    };
    const self = this;
    langTools.addCompleter({
      getCompletions(state, session, pos, prefix, callback) {
        if (prefix.length === 0) {
          callback(null, []);
          return;
        }
        callback(null, self.state.keywords);
      },
    });
    this.onPaste = (text) => {
      const editor = self.refEditor.editor;
      editor.session.doc.replace(editor.selection.getRange(), text);
      const range = editor.selection.getRange();
      window.setTimeout(() => {
        editor.selection.setRange(range);
      }, 0);
    };

    this.onLoad = (editor) => {
      // Release Cmd/Ctrl+L to the browser
      editor.commands.bindKey('Cmd+L', null);
      editor.commands.bindKey('Ctrl+L', null);

      self.props.QuerySnippet.query((snippets) => {
        const snippetManager = snippetsModule.snippetManager;
        const m = {
          snippetText: '',
        };
        m.snippets = snippetManager.parseSnippetFile(m.snippetText);
        snippets.forEach((snippet) => {
          m.snippets.push(snippet.getSnippet());
        });
        snippetManager.register(m.snippets || [], m.scope);
      });
      editor.focus();
      self.props.listenForResize(() => editor.resize());
    };

    this.formatQuery = () => {
      this.props.Query.format(this.props.dataSource.syntax, this.state.queryText)
        .then((queryText) => { this.props.updateQuery(queryText); this.setState({ queryText }); })
        .catch(error => this.props.toastr.error(error));
    };
  }

  render() {
    const hasDoc = this.props.dataSource.options && this.props.dataSource.options.doc;
    return (
      <section style={{ height: '100%' }}>
        <div className="container p-15 m-b-10" style={{ height: '100%' }}>
          <div style={{ height: 'calc(100% - 40px)', marginBottom: '0px' }} className="editor__container">
            <AceEditor
              ref={this.refEditor}
              theme="monokai"
              mode={this.props.syntax}
              value={this.state.queryText}
              editorProps={{ $blockScrolling: Infinity }}
              width="100%"
              height="100%"
              setOptions={{
                behavioursEnabled: true,
                enableSnippets: true,
                enableBasicAutocompletion: this.state.autocompleteQuery,
                enableLiveAutocompletion: this.state.autocompleteQuery,
                autoScrollEditorIntoView: true,
              }}
              showPrintMargin={false}
              wrapEnabled={false}
              onLoad={this.onLoad}
              onPaste={this.onPaste}
              onChange={(queryText) => { this.props.updateQuery(queryText); this.setState({ queryText }); }}
            />
            <label htmlFor="formatQuery" className="btn__format pull-right">
              <button type="button" id="formatQuery" className="btn btn-default btn-s pull-right" onClick={this.formatQuery} title="Format">
                <span className="zmdi zmdi-format-indent-increase" />
              </button>
              <span className="p-5 di-block">
                <input
                  type="checkbox"
                  onClick={() => this.setState({ autocompleteQuery: !this.state.autocompleteQuery })}
                  checked={this.state.autocompleteQuery}
                />
                <span className="fa fa-magic" /> Autocomplete
              </span>
            </label>
          </div>

          <div className="editor__control">
            <div className="row form-inline">
              <div className="col-xs-5 text-left">
                {this.props.isQueryOwner ? <select className="form-control datasource-small" ng-model="query.data_source_id" onChange={this.props.updateDataSource}>{this.props.dataSources.map(ds => <option label={ds.name} value={ds.id} key={`ds-option-${ds.id}`}>{ds.name}</option>)}</select> : ''}
                {hasDoc ? <a href={this.props.dataSource.options.doc_url}>{this.props.dataSource.type_name} documentation</a> : ''}
                {hasDoc ? this.props.dataSource.type_name : ''}
              </div>

              <div className="col-xs-7">
                <div className="editor__control--right">
                  <button className="btn btn-default" ng-show="canEdit" onClick={this.props.saveQuery} title="Save">
                    <span className="fa fa-floppy-o" />
                    <span className="hidden-xs">Save</span>
                    {this.state.isDirty ? '&#42;' : ''}
                  </button>

                  <button type="button" className="btn btn-primary" disabled={this.state.queryExecuting || !this.props.canExecuteQuery()} onClick={this.props.executeQuery}>
                    <span className="zmdi zmdi-play" />
                    <span className="hidden-xs">Execute</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </section>);
  }
}
