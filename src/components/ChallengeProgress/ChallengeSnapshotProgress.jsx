import _isEqual from "lodash/isEqual";
import { Component } from "react";
import { FormattedMessage } from "react-intl";
import ReviewStatusMetrics from "../../pages/Review/Metrics/ReviewStatusMetrics";
import ChallengeProgress from "./ChallengeProgress";
import messages from "./Messages";

export class ChallengeSnapshotProgress extends Component {
  shouldComponentUpdate(nextProps) {
    // Only re-render if the challenge, metrics or visibility changes
    if (!_isEqual(nextProps.taskMetrics, this.props.taskMetrics)) {
      return true;
    }

    if (nextProps?.challenge?.id !== this.props.challenge?.id) {
      return true;
    }

    if (!_isEqual(this.props.showByPriority, nextProps.showByPriority)) {
      return true;
    }
    return false;
  }

  render() {
    return (
      <div className="">
        <ChallengeProgress {...this.props} />
        <div className="">
          <div className="mr-my-4 mr-text-turquoise mr-text-lg mr-font-medium">
            <FormattedMessage {...messages.reviewStatusLabel} />
          </div>
          <ReviewStatusMetrics {...this.props} />
        </div>
      </div>
    );
  }
}

export default ChallengeSnapshotProgress;
