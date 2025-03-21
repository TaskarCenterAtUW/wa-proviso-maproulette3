import _isEmpty from "lodash/isEmpty";
import _pick from "lodash/pick";
import PropTypes from "prop-types";
import { Component } from "react";
import { FormattedMessage } from "react-intl";
import { Link } from "react-router-dom";
import { replacePropertyTags } from "../../hooks/UsePropertyReplacement/UsePropertyReplacement";
import AsManager from "../../interactions/User/AsManager";
import { OPEN_STREET_MAP } from "../../services/VisibleLayer/LayerSources";
import BusySpinner from "../BusySpinner/BusySpinner";
import WithChallengePreferences from "../HOCs/WithChallengePreferences/WithChallengePreferences";
import WithKeyboardShortcuts from "../HOCs/WithKeyboardShortcuts/WithKeyboardShortcuts";
import WithSearch from "../HOCs/WithSearch/WithSearch";
import WithTaskFeatureProperties from "../HOCs/WithTaskFeatureProperties/WithTaskFeatureProperties";
import WithVisibleLayer from "../HOCs/WithVisibleLayer/WithVisibleLayer";
import UserEditorSelector from "../UserEditorSelector/UserEditorSelector";
import messages from "./Messages";
import "./InspectTaskControls.scss";

const shortcutGroup = "taskInspect";

/**
 * InspectTaskControls presents controls used during task inspect by a challenge
 * owner, primarily navigation controls for moving to the next or previous
 * sequential task in the challenge, but also controls for opening the task in
 * an editor or modifying the task data.
 *
 * @author [Neil Rotstan](https://github.com/nrotstan)
 */
export class InspectTaskControls extends Component {
  /** Navigate to the previous sequential task */
  prevTask = () => {
    this.props.previousSequentialTask(this.props.task);
  };

  /** Navigate to the next sequential task */
  nextTask = () => {
    this.props.nextSequentialTask(this.props.task);
  };

  /** Process keyboard shortcuts for the inspect controls */
  handleKeyboardShortcuts = (event) => {
    // Ignore if shortcut group is not active
    if (_isEmpty(this.props.activeKeyboardShortcuts[shortcutGroup])) {
      return;
    }

    if (this.props.textInputActive(event)) {
      // ignore typing in inputs
      return;
    }

    // Ignore if modifier keys were pressed
    if (event.metaKey || event.altKey || event.ctrlKey) {
      return;
    }

    const inspectShortcuts = this.props.keyboardShortcutGroups[shortcutGroup];
    if (event.key === inspectShortcuts.prevTask.key) {
      this.prevTask();
    } else if (event.key === inspectShortcuts.nextTask.key) {
      this.nextTask();
    }
  };

  /** Open the task in an editor */
  pickEditor = ({ value }) => {
    const { task, taskFeatureProperties } = this.props;
    const comment = task.parent.checkinComment;
    const replacedComment = replacePropertyTags(comment, taskFeatureProperties, false);

    this.props.editTask(
      value,
      this.props.task,
      this.props.mapBounds,
      {
        imagery: this.props.source.id !== OPEN_STREET_MAP ? this.props.source : undefined,
        photoOverlay: this.props.showMapillaryLayer ? "mapillary" : null,
      },
      this.props.taskBundle,
      replacedComment,
    );
  };

  modifyTaskRoute = () => {
    return (
      `/admin/project/${this.props.task.parent.parent.id}/` +
      `challenge/${this.props.task.parent.id}/task/${this.props.task.id}/edit`
    );
  };

  componentDidMount() {
    this.props.activateKeyboardShortcutGroup(
      _pick(this.props.keyboardShortcutGroups, shortcutGroup),
      this.handleKeyboardShortcuts,
    );
  }

  componentWillUnmount() {
    this.props.deactivateKeyboardShortcutGroup(shortcutGroup, this.handleKeyboardShortcuts);
  }
  render() {
    const manager = AsManager(this.props.user);
    if (!this.props.task?.parent?.parent) {
      return (
        <div className="inspect-task-controls">
          <BusySpinner />
        </div>
      );
    }

    return (
      <div className="inspect-task-controls">
        {this.props.taskReadOnly ? (
          <div className="mr-mt-4 mr-text-lg mr-text-pink-light">
            <FormattedMessage {...messages.readOnly} />
          </div>
        ) : (
          <UserEditorSelector {...this.props} pickEditor={this.pickEditor} className="mr-mb-4" />
        )}

        {!this.props.taskReadOnly && manager.canWriteProject(this.props.task?.parent?.parent) ? (
          <Link
            to={{ pathname: this.modifyTaskRoute(), state: { fromTaskInspect: true } }}
            className="mr-button mr-mt-2"
            style={{ minWidth: "20.5rem" }}
          >
            <FormattedMessage {...messages.modifyTaskLabel} />
          </Link>
        ) : (
          <div />
        )}

        <div className="mr-mt-2 breadcrumb mr-w-full mr-flex mr-flex-wrap mr-m-auto">
          <button
            className="mr-button mr-mr-2 mr-button--white"
            style={{ minWidth: "10rem" }}
            onClick={this.prevTask}
          >
            <FormattedMessage {...messages.previousTaskLabel} />
          </button>

          <button
            className="mr-button mr-button--white"
            style={{ minWidth: "10rem" }}
            onClick={this.nextTask}
          >
            <FormattedMessage {...messages.nextTaskLabel} />
          </button>
        </div>
      </div>
    );
  }
}

InspectTaskControls.propTypes = {
  /** The task being inspected */
  task: PropTypes.object,
  /** Invoked when the user clicks the previous-task button */
  previousSequentialTask: PropTypes.func.isRequired,
  /** Invoked when the user clicks the next-task button */
  nextSequentialTask: PropTypes.func.isRequired,
};

export default WithSearch(
  WithChallengePreferences(
    WithVisibleLayer(WithKeyboardShortcuts(WithTaskFeatureProperties(InspectTaskControls))),
  ),
  "task",
);
