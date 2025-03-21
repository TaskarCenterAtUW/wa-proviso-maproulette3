import _omit from "lodash/omit";
import { denormalize } from "normalizr";
import { Component } from "react";
import { connect } from "react-redux";
import {
  fetchTask,
  fetchTaskComments,
  taskDenormalizationSchema,
} from "../../../services/Task/Task";

/**
 * WithLoadedTask retrieves a recent copy of the specified task and makes it
 * available to the WrappedComponent, along with a loading prop that is set to
 * true while the retrieval is ongoing. If a local copy is available in the
 * redux store, it will be presented while the latest copy is retrieved.
 *
 * @author [Neil Rotstan](https://github.com/nrotstan)
 */
const WithLoadedTask = function (WrappedComponent) {
  return class extends Component {
    state = {
      loading: false,
    };

    parseTaskId = (props) => parseInt(props.taskId, 10);

    retrieveTask = (props) => {
      this.setState({ loading: true });

      const taskId = this.parseTaskId(props);
      if (!isNaN(taskId)) {
        Promise.all([props.fetchTask(taskId), props.fetchTaskComments(taskId)]).then(() =>
          this.setState({ loading: false }),
        );
      } else {
        this.setState({ loading: false });
      }
    };

    componentDidMount() {
      this.retrieveTask(this.props);
    }

    componentDidUpdate(prevProps) {
      if (this.parseTaskId(this.props) !== this.parseTaskId(prevProps)) {
        this.retrieveTask(this.props);
      }
    }

    render() {
      const taskId = this.parseTaskId(this.props);

      const task = isNaN(taskId)
        ? null
        : denormalize(
            this.props.entities?.tasks?.[taskId],
            taskDenormalizationSchema(),
            this.props.entities,
          );

      return (
        <WrappedComponent
          task={task}
          loading={this.state.loading}
          {..._omit(this.props, ["entities", "fetchTask", "fetchTaskComments"])}
        />
      );
    }
  };
};

const mapStateToProps = (state) => ({
  entities: state.entities,
});

const mapDispatchToProps = (dispatch) => ({
  fetchTask: (taskId) => dispatch(fetchTask(taskId)),
  fetchTaskComments: (taskId) => dispatch(fetchTaskComments(taskId)),
});

export default (WrappedComponent) =>
  connect(mapStateToProps, mapDispatchToProps)(WithLoadedTask(WrappedComponent));
