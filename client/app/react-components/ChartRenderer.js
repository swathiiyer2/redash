import React from 'react';
import PropTypes from 'prop-types';
import { get, isUndefined, sortBy } from 'lodash';

import PlotlyChart from './PlotlyChart';

export default class ChartRenderer extends React.PureComponent {
  static propTypes = {
    // eslint-disable-next-line react/no-unused-prop-types
    queryResult: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired,
    filters: PropTypes.array.isRequired,
  }

  render() {
    let chartSeries;
    if (!isUndefined(this.props.queryResult) && this.props.queryResult.getData(this.props.filters)) {
      const data = this.props.queryResult.getChartData(this.props.options.columnMapping);
      chartSeries = sortBy(data, (o, s) => get(o.seriesOptions, [s && s.name, 'zIndex'], 0));
    } else {
      chartSeries = [];
    }

    return (
      <PlotlyChart
        options={this.props.options}
        series={chartSeries}
        customCode={this.props.options.customCode}
      />
    );
  }
}
