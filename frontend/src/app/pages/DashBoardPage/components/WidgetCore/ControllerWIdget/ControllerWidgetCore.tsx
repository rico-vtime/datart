/**
 * Datart
 *
 * Copyright 2021
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Form } from 'antd';
import { BoardActionContext } from 'app/pages/DashBoardPage/contexts/BoardActionContext';
import { BoardContext } from 'app/pages/DashBoardPage/contexts/BoardContext';
import { WidgetContext } from 'app/pages/DashBoardPage/contexts/WidgetContext';
import { WidgetDataContext } from 'app/pages/DashBoardPage/contexts/WidgetDataContext';
import { ControllerWidgetContent } from 'app/pages/DashBoardPage/pages/Board/slice/types';
import {
  ControllerConfig,
  ControllerDate,
  ControlOption,
} from 'app/pages/DashBoardPage/pages/BoardEditor/components/ControllerWidgetPanel/types';
import { getControllerDateValues } from 'app/pages/DashBoardPage/utils';
import { FilterValueOption } from 'app/types/ChartConfig';
import {
  ControllerFacadeTypes,
  RelativeOrExactTime,
} from 'app/types/FilterControlPanel';
import produce from 'immer';
import React, {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import styled from 'styled-components/macro';
import { MultiSelectControllerForm } from './Controller/MultiSelectController';
import { NumberControllerForm } from './Controller/NumberController';
import { RadioGroupControllerForm } from './Controller/RadioGroupController';
import { RangeNumberControllerForm } from './Controller/RangeNumberController';
import { RangeTimeControllerForm } from './Controller/RangeTimeController';
import { SelectControllerForm } from './Controller/SelectController';
import { SlideControllerForm } from './Controller/SliderController';
import { TextControllerForm } from './Controller/TextController';
import { TimeControllerForm } from './Controller/TimeController';

export const ControllerWidgetCore: React.FC<{}> = memo(() => {
  const widget = useContext(WidgetContext);
  const [form] = Form.useForm();

  const { renderedWidgetById } = useContext(BoardContext);

  const {
    data: { rows },
  } = useContext(WidgetDataContext);
  const { widgetUpdate, refreshWidgetsByFilter } =
    useContext(BoardActionContext);
  const { config, type: facadeType } = useMemo(
    () => widget.config.content as ControllerWidgetContent,
    [widget],
  );
  const {
    controllerDate,
    controllerValues,
    valueOptions,
    valueOptionType,
    sqlOperator,
  } = useMemo(() => config as ControllerConfig, [config]);
  const optionRows = useMemo(() => {
    const dataRows = rows?.flat(2) || [];
    if (valueOptionType === 'common') {
      return dataRows.map(ele => {
        const item: FilterValueOption = {
          key: ele,
          label: ele,
          // children?
        };
        return item;
      });
    } else if (valueOptionType === 'custom') {
      return valueOptions;
    } else {
      return [];
    }
  }, [valueOptions, valueOptionType, rows]);

  useEffect(() => {
    // 加载数据项
    renderedWidgetById(widget.id);
  }, [renderedWidgetById, widget.id]);

  const onControllerChange = useCallback(() => {
    form.submit();
  }, [form]);
  const onFinish = value => {
    const values = value.value;
    if (values && typeof values === 'object' && !Array.isArray(values)) {
      return;
    }
    const _values = values ? (Array.isArray(values) ? values : [values]) : [];
    const nextWidget = produce(widget, draft => {
      (
        draft.config.content as ControllerWidgetContent
      ).config.controllerValues = _values;
    });
    widgetUpdate(nextWidget);
    refreshWidgetsByFilter(nextWidget);
  };
  // const onSqlOperatorAndValues = useCallback(
  //   (sql: FilterSqlOperator, values: any[]) => {
  //     const nextWidget = produce(widget, draft => {
  //       (draft.config.content as ControllerWidgetContent).config.sqlOperator =
  //         sql;
  //       (
  //         draft.config.content as ControllerWidgetContent
  //       ).config.controllerValues = values;
  //     });
  //     widgetUpdate(nextWidget);
  //     refreshWidgetsByFilter(nextWidget);
  //   },
  //   [refreshWidgetsByFilter, widget, widgetUpdate],
  // );
  const onRangeTimeChange = useCallback(
    (timeValues: string[] | null) => {
      const nextFilterDate: ControllerDate = {
        ...controllerDate!,
        startTime: {
          relativeOrExact: RelativeOrExactTime.Exact,
          exactValue: timeValues?.[0],
        },
        endTime: {
          relativeOrExact: RelativeOrExactTime.Exact,
          exactValue: timeValues?.[1],
        },
      };
      const nextWidget = produce(widget, draft => {
        (
          draft.config.content as ControllerWidgetContent
        ).config.controllerDate = nextFilterDate;
      });
      widgetUpdate(nextWidget);
      refreshWidgetsByFilter(nextWidget);
    },
    [controllerDate, refreshWidgetsByFilter, widget, widgetUpdate],
  );

  const onTimeChange = useCallback(
    (value: string | null) => {
      const nextFilterDate: ControllerDate = {
        ...controllerDate!,
        startTime: {
          relativeOrExact: RelativeOrExactTime.Exact,
          exactValue: value,
        },
      };
      const nextWidget = produce(widget, draft => {
        (
          draft.config.content as ControllerWidgetContent
        ).config.controllerDate = nextFilterDate;
      });
      widgetUpdate(nextWidget);
      refreshWidgetsByFilter(nextWidget);
    },
    [controllerDate, refreshWidgetsByFilter, widget, widgetUpdate],
  );

  const control = useMemo(() => {
    let selectOptions = optionRows?.map(ele => {
      return { value: ele.key, label: ele.label } as ControlOption;
    });
    switch (facadeType) {
      case ControllerFacadeTypes.DropdownList:
        form.setFieldsValue({ value: controllerValues?.[0] });
        return (
          <SelectControllerForm
            onChange={onControllerChange}
            options={selectOptions}
            name={'value'}
          />
        );

      case ControllerFacadeTypes.MultiDropdownList:
        form.setFieldsValue({ value: controllerValues });
        return (
          <MultiSelectControllerForm
            onChange={onControllerChange}
            options={selectOptions}
            name={'value'}
          />
        );

      case ControllerFacadeTypes.Slider:
        form.setFieldsValue({ value: controllerValues?.[0] });
        const step = config.sliderConfig?.step || 1;
        const showMarks = config.sliderConfig?.showMarks || false;
        let minValue = config.minValue === 0 ? 0 : config.minValue || 1;
        let maxValue = config.maxValue === 0 ? 0 : config.maxValue || 100;
        return (
          <SlideControllerForm
            onChange={onControllerChange}
            minValue={minValue}
            maxValue={maxValue}
            step={step}
            name="value"
            showMarks={showMarks}
          />
        );

      case ControllerFacadeTypes.Value:
        form.setFieldsValue({ value: controllerValues?.[0] });
        return (
          <NumberControllerForm onChange={onControllerChange} name="value" />
        );

      case ControllerFacadeTypes.RangeValue:
        form.setFieldsValue({ value: controllerValues });
        return (
          <RangeNumberControllerForm
            onChange={onControllerChange}
            name="value"
          />
        );

      case ControllerFacadeTypes.Text:
        form.setFieldsValue({ value: controllerValues?.[0] });
        return (
          <TextControllerForm onChange={onControllerChange} name="value" />
        );

      case ControllerFacadeTypes.RadioGroup:
        form.setFieldsValue({ value: controllerValues?.[0] });
        let RadioOptions = optionRows?.map(ele => {
          return { value: ele.key, label: ele.label } as ControlOption;
        });
        let radioButtonType = config.radioButtonType;
        return (
          <RadioGroupControllerForm
            radioButtonType={radioButtonType}
            onChange={onControllerChange}
            options={RadioOptions}
            name="value"
          />
        );

      case ControllerFacadeTypes.RangeTime:
        const rangeTimeValues = getControllerDateValues(
          config.valueOptionType,
          config!.controllerDate!,
        );

        form.setFieldsValue({ value: rangeTimeValues });
        let rangePickerType = controllerDate!.pickerType;
        return (
          <RangeTimeControllerForm
            pickerType={rangePickerType}
            onChange={onRangeTimeChange}
            name="value"
          />
        );

      case ControllerFacadeTypes.Time:
        const timeValues = getControllerDateValues(
          config.valueOptionType,
          config!.controllerDate!,
        );
        let pickerType = controllerDate!.pickerType;
        form.setFieldsValue({ value: timeValues[0] });
        return (
          <TimeControllerForm
            onChange={onTimeChange}
            pickerType={pickerType}
            name="value"
          />
        );

      default:
        break;
    }
  }, [
    optionRows,
    facadeType,
    form,
    controllerValues,
    onControllerChange,
    config,
    controllerDate,
    onRangeTimeChange,
    onTimeChange,
  ]);
  return (
    <Wrap>
      <Form form={form} className="control-form" onFinish={onFinish}>
        {control}
      </Form>
    </Wrap>
  );
});
const Wrap = styled.div`
  flex: 1;
  display: flex;
  align-items: center;

  .control-form {
    flex: 1;
  }

  .ant-form-item {
    margin-bottom: 0;
  }
`;