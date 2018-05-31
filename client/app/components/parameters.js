import { react2angular } from 'react2angular';
import ParametersComponent from '@/react-components/Parameters';
import QueryBasedParameter from '@/react-components/QueryBasedParameter';
import parameterSettingsTemplate from './parameter-settings.html';

const ParameterSettingsComponent = {
  template: parameterSettingsTemplate,
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&',
  },
  controller($sce, Query) {
    'ngInject';

    this.trustAsHtml = html => $sce.trustAsHtml(html);
    this.parameter = this.resolve.parameter;

    if (this.parameter.queryId) {
      Query.get({ id: this.parameter.queryId }, (query) => {
        this.queries = [query];
      });
    }

    this.searchQueries = (term) => {
      if (!term || term.length < 3) {
        return;
      }

      Query.search({ q: term }, (results) => {
        this.queries = results;
      });
    };
  },
};

export default function init(ngModule) {
  ngModule.component('parameters', react2angular(ParametersComponent, null, ['Query', '$uibModal']));
  ngModule.component('queryBasedParameter', react2angular(QueryBasedParameter, null, ['Query']));
  ngModule.component('parameterSettings', ParameterSettingsComponent);
}
