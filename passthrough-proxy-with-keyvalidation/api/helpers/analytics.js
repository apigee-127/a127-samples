'use strict';

module.exports.finalizeRecord = function finalizeRecord(req, res, record, cb) {

  // make any final adjustments to Analytics record

  if (req.analyticsInfo) {
    record.target_url = req.analyticsInfo.target_url;
    record.target_sent_start_timestamp = req.analyticsInfo.target_sent_start_timestamp;
    record.target_received_start_timestamp = Date.now();
  }

  cb(null, record);
};
