define(['jquery', 'underscore', 'backbone', 'prjAttachment', 'text!uploadFilesTemplates/UploadTemplate.html', 'text!uploadFilesTemplates/UploadItem.html', 'bootstrap', 'jquery.ui.widget', 'jquery.iframe.transport', 'jquery.fileupload', 'jquery.fileupload.ui'],
function ($, _, Backbone, prjAttachment, uploadTml, uploaditemTml) {
    var uploadFilesView = Backbone.View.extend({
        tagName: 'div',
        id: 'uploadDiv',
        baseUrl: './Framework/handler/FileUploadHandler.ashx?',
        model: new prjAttachment(),
        initialize: function (viewOptions, dataOptions, originalFileList) {
            //
            this.parms = dataOptions;
            this.parms.enableDownload = viewOptions.enableDownload || false;
            this.parms.enableDelete = viewOptions.enableDelete || false;
            this.parms.enableUpload = (viewOptions.enableUpload == null || viewOptions.enableUpload == undefined) ? true : viewOptions.enableUpload;
            this.url = this.baseUrl + "path=" + escape(dataOptions.path);
            this.path = dataOptions.path;
            //给上传控件加标题
            this.parms.title = (dataOptions.title == undefined || dataOptions.title == null) ? "文件上传/文件列表" : dataOptions.title;
            this.render();
            this.build();
            this.length = 0;
            //显示已经上传的附件列表(从物理路径中取)
            //this.getOriginalFileList();
            //从数据库中取
            this.getUploadedFilesFromDataBase();

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
        getOriginalFileList: function () {
            var self = this;
            $.ajax({
                url: this.baseUrl + "path=" + escape(this.path),
                type: "GET",
                success: function (rsp) {
                    self.fileListData = [];
                    var originFileArr = null;
                    if (self.parms.originFiles != null || self.parms.originFiles != undefined) {
                        originFileArr = self.parms.originFiles.split(',');
                    }
                    for (var i = 0; i < rsp.length; i++) {
                        var viewData = {
                            "fileName": rsp[i].name,
                            "fileSize": (rsp[i].size / 1000).toFixed(2),
                            "id": 'uploadFiles_' + self.length++,
                            "isnew": false,
                            "url": "http://" + global.siteconfig.serverIP + "/" + "/" + global.siteconfig.bufileRoot + "/" + self.path + "//" + rsp[i].name,
                            "enableDownload": self.parms.enableDownload,
                            "enableDelete": self.parms.enableDelete
                        };
                        //防止公用同一个文件夹造成把所有文件都呈现出来
                        if (originFileArr != null) {
                            if (originFileArr.some(function (name, index) {
                                return name == viewData.fileName;
                            })) {
                                $(".files").prepend(_.template(uploaditemTml)(viewData));
                                self.fileListData.push(viewData);
                            }
                        } else {
                            $(".files").prepend(_.template(uploaditemTml)(viewData));
                            self.fileListData.push(viewData);
                        }
                        //  $(self.el).find("#" + viewData.id).find('.deleteAtServer').show();
                        // $(self.el).find("#" + viewData.id).find('.downloadFromServer').show();
                    }
                    var fileNames = [];
                    _.each(self.fileListData, function (item, index) {
                        fileNames.push(item.fileName);
                    });
                    self.trigger('uploadFiles.result', fileNames);
                },
                error: function (rsp) {
                }
            });
        },
        render: function () {
            this.$el.html(_.template(uploadTml)({ title: this.parms.title }));
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
        },
        events: {
            "click #total": "fileSubmit",
            "click .deleteAtServer": "deleteAtServer",
            "click .cancleUpload": "cancleUpload"
            //"click .downloadFromServer": "downloadFromServer"
        },
        deleteAtServer: function (e) {
            var self = this;
            bootbox.confirm("确定要从服务器上删除？", function (result) {
                if (result) {
                    var id = $(e.currentTarget).parent().parent().attr("id");
                    var fileName = '';
                    if (self.fileListData != null) {
                        for (var i = 0; i < self.fileListData.length; i++) {
                            var fileinfo = self.fileListData[i];
                            if (fileinfo.id == id) {
                                fileName = fileinfo.fileName;
                                break;
                            }
                        }
                    }
                    if (fileName != "") {
                        $.ajax({
                            url: self.baseUrl,
                            type: "POST",
                            data: {
                                fileName: fileName,
                                path: self.path,
                                action: 'delete'
                            },
                            success: function (e) {
                                if (e.success) {
                                    self.deleteFromView(id);
                                    notify.show("删除成功", "success");
                                    var fileNames = [];
                                    _.each(self.fileListData, function (item, index) {
                                        fileNames.push(item.fileName);
                                    });
                                    self.trigger('uploadFiles.result', fileNames);
                                    self.trigger('uploadFiles.deleleResult', fileNames);
                                }
                            },
                            error: function (e) {
                                alert(e);
                            }
                        });
                    }
                }
            })
        },
        cancleUpload: function (e) {
            var id = $(e.currentTarget).parent().parent().attr("id");
            this.deleteFromView(id);
        },
        downloadFromServer: function (e) {
            var id = $(e.currentTarget).parent().parent().attr("id");
            var fileName = '';
            if (this.fileListData != null) {
                for (var i = 0; i < this.fileListData.length; i++) {
                    var fileinfo = this.fileListData[i];
                    if (fileinfo.id == id) {
                        fileName = fileinfo.fileName;
                        break;
                    }
                }
            }
            if (fileName != "") {
                var url = this.path + "//" + fileName;
                url = "http://" + global.siteconfig.serverIP + "/" + "/" + global.siteconfig.bufileRoot + "/" + this.path + "//" + fileName;
                this.downloadFile(url);
            }
        },
        downloadFile: function (url) {
            try {
                var elemIF = document.createElement("iframe");
                elemIF.src = url;
                elemIF.style.display = "none";
                document.body.appendChild(elemIF);
                window.open(url);
            } catch (e) {

            }
        },
        deleteFromView: function (id) {
            $(this.el).find("#" + id).remove();
            var fileName = '';
            if (this.fileListData != null) {
                for (var i = 0; i < this.fileListData.length; i++) {
                    var fileinfo = this.fileListData[i];
                    if (fileinfo.id == id) {
                        this.fileListData.splice(i, 1);
                        fileName = fileinfo.fileName;
                        i--;
                    }
                }
            }
            if (fileName != '' && !(this.filedata == null || this.filedata == undefined)) {
                for (var j = 0; j < this.filedata.files.length; j++) {
                    if (fileName == this.filedata.files[j].name) {
                        this.filedata.files.splice(j, 1);
                        j--;
                    }
                }
            }
        },
        updateFileListData: function (uploadedFileNames) {
            for (var i = 0; i < this.fileListData.length; i++) {
                var fileinfo = this.fileListData[i];
                if (fileinfo.isnew) {
                    var iscontain = uploadedFileNames.some(function (item, index) {
                        return fileinfo.fileName == item;
                    });
                    if (iscontain) {
                        fileinfo.isnew = false;
                        if (this.parms.enableDelete) {
                            $(this.el).find("#" + fileinfo.id).find(".deleteAtServer").show();
                        }
                        if (this.parms.enableDownload) {
                            $(this.el).find("#" + fileinfo.id).find(".downloadFromServer").show();
                        }
                        $(this.el).find("#" + fileinfo.id).find(".cancleUpload").hide();
                    } else {
                        this.deleteFromView(fileinfo.id);
                        this.fileListData.splice(i, 1);
                        i--;
                    }
                }
            }
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
                "enableDelete": this.parms.enableDelete,
                "uploader":window.global.userinfo.TrueName,
                "uploadTime": this.formatDateTime(new Date())
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
                    var j = 0;
                    //fileNames只保存文件名，fileInfos保存文件的名称和大小，方便传回父view保存到数据库
                    var fileNames = [];
                    var fileInfos = [];
                    for (var i = 0; i < att.length; i++) {
                        var modelData = {
                            fileName: att[i].name,
                            fileSize: (att[i].size / 1000).toFixed(2),
                            path: self.parms.path
                        };
                        fileNames.push(att[i].name);
                        fileInfos.push(modelData);
                        self.model.set(modelData);
                        Backbone.sync("create", self.model, {
                            async: false, //能否同步
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

                                    // 上传成功后，要返回的文件名
                                    fileNames = [];
                                    _.each(self.fileListData, function (item, index) {
                                    fileNames.push(item.fileName);
                                    });
                                    
                                    self.trigger('uploadFiles.result', fileNames);
                                    //self.trigger('uploadFiles.uploadResult', fileNames);
                                    self.trigger('uploadFiles.uploadResult', fileInfos);
                                    self.filedata = null;

                                }
                            },
                            error: function () { }
                        });
                    }
                },
                fail: function (e, data) {
                    $(".pstate").text('文件过大，上传失败');
                },
                progressall: function (e, data) {
                    $(".pstate").text('上传中...');
                    var progress = parseInt(data.loaded / data.total * 100, 10);
                    $('.bar').css('width', progress + '%')
                    if (progress == 100) {
                        $('.fileState').text('正常');
                        $('.fileState').css('color', 'Green');
                    } 
                }
            });
        },
        getUploadedFilesFromDataBase: function () {
            //从数据库的附件表取已存在的附件,需要在dataOptions参数中传projectID/fileType
            var self = this;
            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: utilTools.getServiceUrl('meterProject') + "AttachmentsForPanel?projectID=" + this.parms.projectId + "&fileType=" + escape(this.parms.fileType) + "&_mid=" + Math.floor(Math.random() * 1000),
              //async: false,(这两个参数千万不能加!!!!!!)
              //cache: false,
                success: function (response, options) {
                    //
                    var fileInfo = response.getMe;
                    self.fileListData = [];
                    var originFileArr = null;
                    if (self.parms.originFiles != null || self.parms.originFiles != undefined) {
                        originFileArr = self.parms.originFiles.split(',');
                    }
                    for (var i = 0; i < fileInfo.length; i++) {
                        var viewData = {
                            "fileName": fileInfo[i].FileName,
                            "fileSize": fileInfo[i].FileSize,
                            "id": 'uploadFiles_' + self.length++,
                            "isnew": false,
                            "url": "http://" + global.siteconfig.serverIP + "/" + "/" + global.siteconfig.bufileRoot + "/" + fileInfo[i].url,
                            "enableDownload": self.parms.enableDownload,
                            "enableDelete": self.parms.enableDelete,
                            "uploader": fileInfo[i].Uploader,
                            "uploadTime": fileInfo[i].UploadTime
                        };
                        //2015.3.31 hj 替换地址中的#字符
                        viewData.url=viewData.url.replace(/#/g,"%23");
                        if (originFileArr != null) {
                            if (originFileArr.some(function (name, index) {
                                return name == viewData.fileName;
                            })) {
                                $(".files").prepend(_.template(uploaditemTml)(viewData));
                                self.fileListData.push(viewData);
                            }
                        } else {
                            $(".files").prepend(_.template(uploaditemTml)(viewData));
                            self.fileListData.push(viewData);
                        }
                    }
                    var fileNames = [];
                    _.each(self.fileListData, function (item, index) {
                        fileNames.push(item.fileName);
                    });
                    self.trigger('uploadFiles.result', fileNames);
                    self.trigger('uploadFiles.result', fileInfo);
                },
                error: function (response, options) {
                    notify.show('获取附件信息失败');
                }
            });
        },
        formatDateTime: function (d) {
            var ret = d.getFullYear() + "-"
            ret += ("00" + (d.getMonth() + 1)).slice(-2) + "-"
            ret += ("00" + d.getDate()).slice(-2) + " "
            ret += ("00" + d.getHours()).slice(-2) + ":"
            ret += ("00" + d.getMinutes()).slice(-2) + ":"
            ret += ("00" + d.getSeconds()).slice(-2)
            return ret;
        },
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

