define(['jquery', 'underscore', 'backbone', 'prjAttachment', 'text!uploadFilesTemplates/UploadTemplate.html', 'text!uploadFilesTemplates/UploadItem.html', 'bootstrap', 'jquery.ui.widget', 'jquery.iframe.transport', 'jquery.fileupload', 'jquery.fileupload.ui'],
function ($, _, Backbone, prjAttachment, uploadTml, uploaditemTml) {
    var uploadFilesView = Backbone.View.extend({
        filePathS: "",
        tagName: 'div',
        id: 'uploadDiv',
        baseUrl: './Framework/handler/FileUploadHandler.new.ashx?',
        model: new prjAttachment(),
        initialize: function (viewOptions, dataOptions, originalFileList) {
            this.parms = dataOptions;
            this.parms.enableDownload = viewOptions.enableDownload || false;
            this.parms.enableDelete = viewOptions.enableDelete || false;
            this.parms.enableUpload = (viewOptions.enableUpload == null || viewOptions.enableUpload == undefined) ? true : viewOptions.enableUpload;
            this.url = this.baseUrl + "path=" + escape(dataOptions.path);
            this.path = dataOptions.path;
            this.render();
            this.build();
            this.length = 0;
            //显示已经上传的附件列表
            // this.getOriginalFileList();
        },
        //重新定义一些参数
        reset: function (dataOptions) {
            _.extend(this.parms, dataOptions);
            this.url = escape(this.baseUrl + "?path=" + this.parms.url);
        },
        //进行刷新操作
        refresh: function () { },
        //考虑到工程登记页面如果修改之前填写工程编号之后，
        //上传路径是不同的，将之前的东西迁移到新的路径中
        moveUploaded: function (fileName) {

        },
    
        render: function () {
            this.$el.html(_.template(uploadTml)());
            if (this.parms.enableUpload == false) {
                $(this.el).find("#uploadOperaBar").hide();
            }
            //已经上传的附件
            this.uploadedData = [];
            if ($('#uploadDiv').length > 0) {
                $('#uploadDiv').unbind();
                $('#uploadDiv').remove();
            }
            this.$el.appendTo('body');
            /*$(".divmodal").on('hidden', function() {
            $(".files").html("");
            });*/

        },
        events: {
            "click #total": "fileSubmit"
           // "click .deleteAtServer": "deleteAtServer",
          //  "click .cancleUpload": "cancleUpload"
            //"click .downloadFromServer": "downloadFromServer"
        },
    
        cancleUpload: function (e) {
            var id = $(e.currentTarget).parent().parent().attr("id");
            this.deleteFromView(id);
        },
      
        addFiles: function (e, data) {
            //检查重名
            if (this.fileListData != null) {
                for (var i = 0; i < this.fileListData.length; i++) {
                    var fileinfo = this.fileListData[i];
                    if (fileinfo.fileName == data.files[0].name) {
                        notify.show("文件名重复", "error");
                        return;
                    }
                }
            }
            var viewData = {
                "fileName": data.files[0].name,
                "fileSize": (data.files[0].size / 1000).toFixed(2),
                "id": 'uploadFiles_' + this.length++,
                "isnew": true,
                "url": "http://" + global.siteconfig.serverIP + "/" + "/" + global.siteconfig.bufileRoot + "/" + this.path + "//" + data.files[0].name,
                "enableDownload": this.parms.enableDownload,
                "enableDelete": this.parms.enableDelete
            };
            $(".files").prepend(_.template(uploaditemTml)(viewData));
            if (this.filedata == null) {
                this.filedata = data;
            }
            else {
                this.filedata.files.push(data.files[0]);
            }
            //将已经上传的附件保存起来
            if (this.fileListData == null) {
                this.fileListData = [];
            }
            //用来记录已经上传的和待上传的
            this.fileListData.push(viewData);
        },
        fileSubmit: function () {
            $(this.el).find("#totalProgressBar").show();
            if (this.filedata != null) {
                this.filedata.submit(); //上传文件
            }
        },
        //构建upload插件
        build: function () {
            var self = this;
            $('#fileupload').fileupload({
                url: self.url,
                dataType: 'json',
                add: function (e, data) {
                    self.addFiles(e, data);
                },
                done: function (e, data) {
                    $(".pstate").text('上传成功');
                    //回调返回上传数据
                    var att = data.result;
                    var filePathStr = "";

                    for (var i = 0; i < att.length; i++) {
                        filePathStr += att[i].name + ",";
                    }
                    var filesLength = filePathStr.length;
                    if (filesLength >= 1) {
                        self.filePathS = filePathStr.substring(0, filesLength - 1);
                    }
                    var j = 0;
                    var fileNames = [];
                    for (var i = 0; i < att.length; i++) {
                        var modelData = {
                            fileName: att[i].name,
                            fileSize: att[i].size,
                            path: self.parms.path
                        };
                        fileNames.push(att[i].name);
                        self.model.set(modelData);
                        Backbone.sync("create", self.model, {
                            success: function (model, response) {
                                j += 1;
                                //传递回去
                                if (j == att.length) {
                                    if (response == -1) {
                                        //插入失败
                                    }
                                    //上传成功后延时一段时间后隐藏
                                    //setTimeout("$('#uploadCancle').trigger('click');$('div.bar').css('width','0%');$('.pstate').text('准备上传');", 2000);
                                    $(self.el).find("#totalProgressBar").hide();
                                    self.updateFileListData(fileNames);
                                    fileNames = [];
                                    _.each(self.fileListData, function (item, index) {
                                        fileNames.push(item.fileName);
                                    });
                                    self.trigger('uploadFiles.result', fileNames);
                                    self.trigger('uploadFiles.uploadResult', fileNames);
                                    self.filedata = null;
                                    //$('.divmodal').modal('hide');
                                }
                            },
                            error: function () { }
                        });
                        //                        self.model.save(modelData, {
                        //                            success: function (model, response) {
                        //                                j += 1;
                        //                                //传递回去
                        //                                if (j == att.length) {
                        //                                    if (response == -1) {
                        //                                        //插入失败
                        //                                    }
                        //                                    //上传成功后延时一段时间后隐藏
                        //                                    //setTimeout("$('#uploadCancle').trigger('click');$('div.bar').css('width','0%');$('.pstate').text('准备上传');", 2000);
                        //                                    $(self.el).find("#totalProgressBar").hide();
                        //                                    self.updateFileListData(fileNames);
                        //                                    fileNames = [];
                        //                                    _.each(self.fileListData, function (item, index) {
                        //                                        fileNames.push(item.fileName);
                        //                                    });
                        //                                    self.trigger('uploadFiles.result', fileNames);
                        //                                    self.trigger('uploadFiles.uploadResult', fileNames);
                        //                                    self.filedata = null;
                        //                                    //$('.divmodal').modal('hide');
                        //                                }
                        //                            },
                        //                            error: function () { }
                        //                        });
                    }
                },
                fail: function (e, data) {
                    $(".pstate").text('上传失败');
                },
                progressall: function (e, data) {
                    $(".pstate").text('上传中...');
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $('.bar').css('width', progress + '%');
                }
            });
        },
        /*
        destroy:function(){
        //解除事件绑定
        this.undelegateEvents();
        this.$el.removeData().unbind();
        this.remove();
        Backbone.View.prototype.remove.call(this);
        },
        */
        destroy: function () {
            if (this.registerView) {
                this.registerView.destroy();
            }
            this.stopListening();
            //解除事件绑定
            this.undelegateEvents();
            this.$el.removeData().unbind();
            this.cloneAndClearDom();
            //从dom中删除
            this.remove();
            Backbone.View.prototype.remove.call(this);
        },
        cloneAndClearDom: function () {
            var thisDom = $(this.el);
            var parentDom = thisDom.parent();
            var prevDom = thisDom.prev();
            var nextDom = thisDom.next();
            if (prevDom.length + nextDom.length == 0) {
                parentDom.append(thisDom.clone().empty());
            } else {
                if (prevDom.length > 0) {
                    prevDom.after(thisDom.clone().empty());
                } else {
                    nextDom.before(thisDom.clone().empty());
                }
            }
        }
    });
    return uploadFilesView;
});

