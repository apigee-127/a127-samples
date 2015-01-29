'use strict';

    module.exports = {
      passwordCheck: passwordCheck
    };

        function passwordCheck(username, password, cb) {
          var passwordOk = (username === 'scott' && password === 'apigee');
          cb(null, passwordOk);
        }
