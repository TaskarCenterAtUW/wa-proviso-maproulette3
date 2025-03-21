import classNames from "classnames";
import _map from "lodash/map";
import PropTypes from "prop-types";
import { Component, Fragment } from "react";
import ReactGridLayout, { WidthProvider } from "react-grid-layout";
import { widgetComponent } from "../../services/Widget/Widget";
import WithWidgetManagement from "../HOCs/WithWidgetManagement/WithWidgetManagement";
import WidgetPicker from "../WidgetPicker/WidgetPicker";
import "../../../node_modules/react-grid-layout/css/styles.css";
import "../../../node_modules/react-resizable/css/styles.css";
import "./WidgetGrid.scss";

const GridLayout = WidthProvider(ReactGridLayout);

export class WidgetGrid extends Component {
  render() {
    // Setup each widget. Note that we assign a z-index to each widget so that
    // widgets closer to the top of the page have a higher z-index than widgets
    // closer to the bottom of the page. This is so that an open dropdown menu
    // in a widget can extend below it and overlap the widget immediately
    // below. The z-index is necessary because react-grid-layout starts a new
    // stacking context for each widget, so by default widgets lower on the
    // page would be rendered on top of widgets higher on the page since they
    // appear lower in the DOM, thus breaking drop-down menus that extend below
    // a widget
    const highestY = Math.max(
      ..._map(this.props.workspace.widgets, (w, i) => this.props.workspace.layout[i].y),
    );

    const GridFilters = this.props.filterComponent;
    const conditionalWidgets = this.props.workspace.conditionalWidgets || [];
    const permanentWidgets = this.props.workspace.permanentWidgets || [];
    const widgetInstances = _map(this.props.workspace.widgets, (widgetConfiguration, index) => {
      const widgetPermanent = permanentWidgets.indexOf(widgetConfiguration.widgetKey) !== -1;
      let widgetHidden = false;
      const WidgetComponent = widgetComponent(widgetConfiguration);
      if (!WidgetComponent) {
        throw new Error(`Missing component for widget: ${widgetConfiguration.widgetKey}`);
      }

      const widgetLayout = this.props.workspace.layout[index];

      // Hide conditional widgets that shouldn't be shown
      if (conditionalWidgets.indexOf(widgetConfiguration.widgetKey) !== -1) {
        if (WidgetComponent.hideWidget?.(this.props)) {
          widgetHidden = true;
          if (widgetLayout.h > 0) {
            widgetConfiguration.priorHeight = widgetLayout.h;
            widgetLayout.minH = 0;
            widgetLayout.h = 0;
          }
        } else if (widgetLayout.h === 0) {
          widgetLayout.minH = widgetConfiguration.minHeight;
          widgetLayout.h =
            widgetConfiguration.priorHeight > 0
              ? widgetConfiguration.priorHeight
              : widgetConfiguration.defaultHeight;
        }
      }

      const widgetStyle = {
        zIndex: widgetHidden ? 0 : highestY - widgetLayout.y, // higher values towards top of page
      };

      // Prevent the editing layout from rendering an empty resizable elememnt for "permanent but conditionally shown" widgets
      // that are currently hidden.
      if (widgetHidden && widgetPermanent && this.props.isEditing) widgetStyle["display"] = "none";

      return (
        <div
          key={widgetLayout.i}
          className={classNames("mr-card-widget", {
            "mr-card-widget--editing": this.props.isEditing,
            "mr-card-widget--top-row": widgetLayout.y === 0,
          })}
          style={widgetStyle}
        >
          <WidgetComponent
            {...this.props}
            widgetLayout={widgetLayout}
            widgetConfiguration={widgetConfiguration?.defaultConfiguration ?? {}}
            updateWidgetConfiguration={(conf) => this.props.updateWidgetConfiguration(index, conf)}
            widgetHidden={widgetHidden}
            widgetPermanent={widgetPermanent}
            removeWidget={() => this.props.removeWidget(index)}
          />
        </div>
      );
    });

    return (
      <div className={classNames("widget-grid", { "widget-grid--editing": this.props.isEditing })}>
        <div className="widget-grid__controls">
          {GridFilters && <GridFilters {...this.props} />}
          {this.props.isEditing && (
            <Fragment>
              {this.props.editNameControl}
              <WidgetPicker {...this.props} isRight onWidgetSelected={this.props.addWidget} />
              {this.props.doneEditingControl}
              {this.props.cancelEditingControl}
            </Fragment>
          )}
        </div>
        {this.props.subHeader && (
          <div className={classNames({ "mr-mt-24": this.props.isEditing })}>
            {this.props.subHeader}
          </div>
        )}

        <GridLayout
          className="widget-grid"
          cols={this.props.workspace.cols || 12}
          rowHeight={this.props.workspace.rowHeight || 30}
          layout={this.props.workspace.layout || []}
          margin={[16, 16]}
          isDraggable={this.props.isEditing}
          isResizable={this.props.isEditing}
          onLayoutChange={this.props.onLayoutChange}
        >
          {widgetInstances}
        </GridLayout>
      </div>
    );
  }
}

WidgetGrid.propTypes = {
  workspace: PropTypes.shape({
    widgets: PropTypes.array.isRequired,
    cols: PropTypes.number,
    rowHeight: PropTypes.number,
    layout: PropTypes.array,
  }).isRequired,
  onLayoutChange: PropTypes.func.isRequired,
};

export default WithWidgetManagement(WidgetGrid);
