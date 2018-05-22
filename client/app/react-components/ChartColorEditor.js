import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import { SortableContainer, SortableElement, SortableHandle, arrayMove } from 'react-sortable-hoc';

export default class ChartSeriesEditor extends React.Component {
  static propTypes = {
    colorsList: PropTypes.array.isRequired,
    seriesOptions: PropTypes.object.isRequired,
    updateColorsList: PropTypes.func.isRequired,
    updateSeriesOptions: PropTypes.func.isRequired,
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    this.props.updateColorsList(arrayMove(this.props.colorsList, oldIndex, newIndex));
  };

  updateSeriesOptions = (k, v) => {
    const seriesOptions = Object.assign(
      {}, this.props.seriesOptions,
      { [k]: Object.assign({}, this.props.seriesOptions[k], v) },
    );
    this.props.updateSeriesOptions(seriesOptions);
  }

  changeColor = (value, color) => this.updateSeriesOptions(value, { color });

  render() {
    const colors = Object.assign({ Automatic: null }, this.props.ColorPalette);
    const colorSelectItem = opt => (<span style={{
      width: 12, height: 12, backgroundColor: opt.value, display: 'inline-block', marginRight: 5,
    }}
    />);
    const colorOptionItem = opt => <span style={{ textTransform: 'capitalize' }}>{colorSelectItem(opt)}{opt.label}</span>;
    const DragHandle = SortableHandle(({ value }) => <td style={{ cursor: 'move' }}><i className="fa fa-arrows-v" />{ this.props.seriesOptions[value].zIndex + 1 }</td>);
    const SortableItem = SortableElement(({ value }) => (
      <tr>
        <DragHandle value={value} />
        <td style={{ padding: 3, width: 300 }}>
          {value}
        </td>
        <td style={{ padding: 3, width: 35 }}>
          <Select
            value={this.props.seriesOptions[value].color}
            valueRenderer={colorSelectItem}
            options={Object.keys(colors).map(key => ({ value: colors[key], label: key }))}
            optionRenderer={colorOptionItem}
            clearable={false}
            menuContainerStyle={{ width: 160 }}
            onChange={selection => this.changeColor(value, selection.value)}
          />
        </td>
      </tr>
    ));
    const SortableRow = SortableContainer(({ items }) => (
      <tbody>
        {items.map((param, index) => (
          <SortableItem
            key={`item-${param}`}
            index={index}
            value={param}
          />))}
      </tbody>));

    return (
      <div className="m-t-10 m-b-10">
        <table className="table table-condensed col-table">
          <thead>
            <tr>
              <th>zIndex</th>
              <th>Label</th>
              <th>Color</th>
            </tr>
          </thead>
          <SortableRow useDragHandle items={this.props.colorsList} axis="y" onSortEnd={this.onSortEnd} helperClass="sortable-helper" />
        </table>
      </div>
    );
  }
}

