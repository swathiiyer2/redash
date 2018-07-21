
function QuerySourceCtrl($scope, $route) {
  $scope.queryId = $route.current.params.queryId;
}
// eslint-disable-next-line no-unused-vars
function OldQuerySourceCtrl(
  Events, toastr, $controller, $scope, $location, $http, $q,
  AlertDialog, currentUser, Query, Visualization, KeyboardShortcuts,
) {
  // extends QueryViewCtrl
  $controller('QueryViewCtrl', { $scope });

  Events.record('view_source', 'query', $scope.query.id);

  const isNewQuery = !$scope.query.id;
  let queryText = $scope.query.query;
  const saveQuery = $scope.saveQuery;

  $scope.sourceMode = true;
  $scope.isDirty = false;
  $scope.base_url = `${$location.protocol()}://${$location.host()}:${$location.port()}`;

  // @override
  Object.defineProperty($scope, 'showDataset', {
    get() {
      return $scope.queryResult && $scope.queryResult.getStatus() === 'done';
    },
  });

  const shortcuts = {
    'mod+s': function save() {
      if ($scope.canEdit) {
        $scope.saveQuery();
      }
    },
  };

  KeyboardShortcuts.bind(shortcuts);

  $scope.$on('$destroy', () => {
    KeyboardShortcuts.unbind(shortcuts);
  });

  $scope.canForkQuery = () => currentUser.hasPermission('edit_query') && !$scope.dataSource.view_only;

  $scope.updateQuery = (newQueryText) => {
    $scope.query.query = newQueryText;
  };

  // @override
  $scope.saveQuery = (options, data) => {
    const savePromise = saveQuery(options, data);

    savePromise.then((savedQuery) => {
      queryText = savedQuery.query;
      $scope.isDirty = $scope.query.query !== queryText;
      // update to latest version number
      $scope.query.version = savedQuery.version;

      if (isNewQuery) {
        // redirect to new created query (keep hash)
        $location.path(savedQuery.getSourceLink());
      }
    });

    return savePromise;
  };

  $scope.formatQuery = () => {
    Query.format($scope.dataSource.syntax, $scope.query.query)
      .then((query) => { $scope.query.query = query; })
      .catch(error => toastr.error(error));
  };

  $scope.autocompleteQuery = true;
  $scope.toggleAutocompleteQuery = () => {
    $scope.autocompleteQuery = !$scope.autocompleteQuery;
  };

  $scope.listenForResize = (f) => {
    $scope.$on('angular-resizable.resizing', f);
  };

  $scope.$watch('query.query', (newQueryText) => {
    $scope.isDirty = (newQueryText !== queryText);
  });
}

export default function init(ngModule) {
  ngModule.controller('QuerySourceCtrl', QuerySourceCtrl);

  return {
    '/queries/new': {
      template: '<query-view-top query-id="null" source-mode="true" />',
      layout: 'fixed',
      controller: 'QuerySourceCtrl',
      reloadOnSearch: false,
    },
    '/queries/:queryId/source': {
      template: '<query-view-top query-id="queryId" source-mode="true" />',
      layout: 'fixed',
      controller: 'QuerySourceCtrl',
      reloadOnSearch: false,
      resolve: {
        queryId: ($route) => {
          'ngInject';

          return $route.current.params.queryId;
        },
      },
    },
  };
}
