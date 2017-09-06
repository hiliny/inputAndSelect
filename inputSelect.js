/**
 * time 2017-9-5
 * description 可选择的输入框
 * author hiliny
**/

(function($){

	'use strict';

	function InputSelect(context,params){
		this.$el = $(context);
		this.pluginOptions = {};
		$.extend(true,this.pluginOptions,InputSelect.defaults,params);
		this.init();
	}

	InputSelect.defaults = {
		width:'auto',
		height:'auto',
		data:[]
	};

	InputSelect.prototype = {
		constructor:InputSelect,
		show:function(e){
			e && e.stopPropagation();
			if(this.pluginOptions.data.length == 0) return this;
			this.$attach.show();
		},
		hide:function(e){
			if(!e || e.target != this.$el[0]){
				this.$attach.hide();
			}
		},
		setValue:function(e){
			this.hide(e);
			$(e.target).addClass('active').siblings().removeClass('active');
			this.$el.val($(e.target).html());
		},
		changeInput:function(e){
			var currentValue = e.target.value,key = e.keyCode;
			switch(key){
				case 38:
				case 40:
					this.setActiveItem(key);
					break;
				case 13:
					this.enterActiveItem();
					break;
				default:
				// this.$attach.find("li").each(function(index){
				// 		if($(this).html()==currentValue){
				// 			$(this).addClass('active');
				// 		}else{
				// 			$(this).removeClass("active");
				// 		}
				// });					
					break;
			}
		},
		enterActiveItem:function(){
			var itemValue = this.$attach.find("li.active").text();
			if(itemValue && this.$attach.css('display')!="none"){
				this.$el.val(itemValue);
				this.hide();
			}
			return this;
		},
		setActiveItem:function(keyCode){
			var listNum = this.$attach.find("li").length,
			    index = this.$attach.find("li.active").index();
			this.$attach.find("li").removeClass("active"); 
			if(keyCode == 38){
				index = index==0?listNum-1:index-1;
			}
			if(keyCode == 40){
				index = (index == listNum-1||index==-1)?0:index+1;
			}  
			this.$attach.find("li:eq("+index+")").addClass("active");
			return this;
		},
		init:function(){
			this._id = "vc" + (new Date()).getTime() + Math.ceil(Math.random()*1000);
			var container = "<div id='{id}' class='input-select-container'><ul></ul></div>";
			    container = container.replace(/{id}/g,this._id);
			var $container = $(container);
			var jsonData = this.pluginOptions.data;
			$.each(jsonData,function(i,n){
				$container.find("ul").append($("<li class='"+"'>"+n+"</li>"));
			});
			//显示面板模块
			this.$attach = $container;
			this.calculatePosition();
			$(document.body).append($container);
			this.$el.on('focus',$.proxy(this.show,this));
			$(document).on('click',$.proxy(this.hide,this));
			this.$attach.on('click','li',$.proxy(this.setValue,this));
			this.$el.on('keyup',$.proxy(this.changeInput,this));
			$(window).on("resize",$.proxy(this.calculatePosition,this));
		},
		calculatePosition:function(){
			var offset = this.$el.offset();
			var _elWidth = this.pluginOptions.width;
			var _elHeight = this.pluginOptions.height;
			if(_elWidth == "auto"){
				_elWidth = this.$el.outerWidth();
			}
			this.$attach.css({
				left:offset.left+'px',
				top:(offset.top+this.$el.outerHeight())+'px',
				width:_elWidth,
				height:_elHeight
			});			
		},
		dynamicData:function(params){
			if(Object.prototype.toString.call(params)!="[object Array]"){
				throw new Error("Params must be a Array.");
			}
			var self = this;
			this.$attach.find("ul").empty();
			$.each(params,function(i,n){
				self.$attach.find("ul").append($("<li class='"+"'>"+n+"</li>"));
			});
			return this;
		},
		destroy:function(){
			this.$el.off("focus");
			this.$attach.off("click");
			this.$el.removeData("control-cache");
			this.$attach.remove();
		}
	}

    function Plugin(params){
    	var inner = Array.prototype.slice.call(arguments,1);
    	return this.each(function(){
    		var $this = $(this),data = $this.data("control-cache");
    		!data && $this.data("control-cache",data = new InputSelect(this,params));
    		if(typeof params == "string") data[params].apply(data,inner);
    	});
    }

    $.fn.inputSelect = Plugin;
    var old = $.fn.inputSelect;
    $.fn.inputSelect.noConflict = function(){
    	$.fn.inputSelect = old;
    	return this;
    }
  
})(jQuery);