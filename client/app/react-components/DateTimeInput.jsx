import moment from 'moment';
import React from 'react';
import PropTypes from 'prop-types';
import { DatePicker } from 'antd';

export default function DateTimeInput({
  value,
  withSeconds,
  onSelect,
  clientConfig,
}) {
  const format = (clientConfig.dateFormat || 'YYYY-MM-DD') +
    (withSeconds ? ' HH:mm:ss' : ' HH:mm');
  const defaultValue = moment(value, format);
  return (
    <DatePicker
      showTime
      {...(defaultValue.isValid() ? { defaultValue } : {})}
      format={format}
      placeholder="Select Date and Time"
      onChange={onSelect}
    />
  );
}

DateTimeInput.propTypes = {
  value: PropTypes.instanceOf(Date),
  withSeconds: PropTypes.bool,
  onSelect: PropTypes.func,
};

DateTimeInput.defaultProps = {
  value: Date.now(),
  withSeconds: false,
  onSelect: () => {},
};
