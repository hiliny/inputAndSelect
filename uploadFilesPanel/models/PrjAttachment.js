define(['jquery', 'backbone'], function ($, Backbone) {
    function getUrl() {
        var userid = window.global.userinfo.UserID;
        var serverIP = window.global.siteconfig.serverIP;
        var serverurl = utilTools.getServiceUrl('workFlow') + '/' + 1 + "/Attachment";
        return serverurl;
    }
    var prjAttachment = Backbone.Model.extend({
        url: getUrl(),
        defaults: {
            "id": 0,
            "fileName": "",
            "fileSize": "",
            "createTime": "",
            "userid":"",
            "path":""
        }
    });
    return prjAttachment;
});
