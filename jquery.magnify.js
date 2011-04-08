/**
	© Taras Bogach 2010
	© Богач Тарас Программирование 2010
	License - http://www.gnu.org/licenses/gpl.txt
*/
(function($){
	$.fn.magnify=function(){
		for(var i=0; i<this.length; i++){
			var magnify=$(this[i]).data('magnify')
			if(!magnify || magnify===null || magnify===''){
				magnify=new $.fn.magnify.Magnify(this[i],arguments[0],arguments[1])
			}else{
				magnify[arguments[0]].call(arguments[1]);
			}
		}
	}
	$.fn.magnify.Magnify=function(element,options,properties){
		properties=properties||{width:'200%',height:'200%'}
		this.element=$(element).data('magnify',this)
		this.options(options)
		this.snapshot(properties)
		this.properties(properties)
		this.enable()
	}
	$.fn.magnify.Magnify.prototype={
		whitespaceChar:' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000',
		numberChar:'0123456789',
		skipEvents:0,
		snapshot:function(){
			if(arguments.length==0){
				return this._snapshot
			}else{
				this._snapshot=$.extend(true,{},arguments[0])
				for(var name in this._snapshot){
					this._snapshot[name]=this.parse(this.element.css(name))
				}
				return this
			}
		},
		options:function(){
			if(arguments.length==0){
				return this._options
			}else{
				this._options=$.extend(true,{
					distance:100,
					distanceTo:'closest',
					axis:'xy',
					skipEvents:0,
					triggerEvents:false,
					before:null,
					after:null,
					delta:'linear'
				},arguments[0])
				if(typeof(this._options.delta)=='string' && this.delta[this._options.delta]){
					this._options.delta=this.delta[this._options.delta]
				}
				if(typeof(this._options.delta)!='function'){
					throw 'jQuery.fn.magnify: configuration error!';
				}
				if(typeof(this._options.distanceTo)=='string' && this.distanceTo[this._options.distanceTo]){
					this._options.distanceTo=this.distanceTo[this._options.distanceTo]
				}
				if(typeof(this._options.distanceTo)!='function'){
					throw 'jQuery.fn.magnify: configuration error!';
				}
				return this
			}
		},
		properties:function(){
			if(arguments.length==0){
				return this._properties
			}else{
				this._properties=$.extend(true,{},arguments[0])
				for(var name in this._properties){
					var absUnit=this._snapshot[name][0],
						absValue=this._snapshot[name][1]
					if(!(this._properties[name] instanceof Array)){
						this._properties[name]=[this._properties[name]]
					}
					for(var i=0; i<this._properties[name].length; i++){
						if(typeof(this._properties[name][i])!='object'){
							var val=this._properties[name][i],
								delta=(i+1)/this._properties[name].length
							this._properties[name][i]={}
							this._properties[name][i][delta]=val
						}
						for(var delta in this._properties[name][i]){
							this._properties[name][i][delta]=this.parse(this._properties[name][i][delta])
							if(absUnit!="%" && this._properties[name][i][delta][0]=="%"){
								this._properties[name][i][delta][1]=this._properties[name][i][delta][1]*absValue/100
							}
						}
					}
				}
				return this
			}
		},
		render:function(event){
			if(this.skipEvents++%(this._options.skipEvents+1)!=0)return;
			if(this._options.triggerEvents==true)this.element.trigger('magnifybefore',{event:event})
			if(typeof(this._options.before)=='function')this._options.before.call(this.element,event)
			var mousePosition=[event.pageX,event.pageY],
				elementPosition=[0,0],
				elementDimentions=[this.element.outerWidth(false),this.element.outerHeight(false)]
			var offset=this.element.get(0);
			do{
				elementPosition[0]+=offset.offsetLeft;
				elementPosition[1]+=offset.offsetTop;
			}while(offset=offset.offsetParent)
			var distance=this._options.distanceTo.call(this,mousePosition,elementPosition,elementDimentions)
			var delta=1-this._options.delta.call(this,distance>this._options.distance?this._options.distance:distance)
			for(var name in this._properties){
				var property=this._properties[name]
				var minDelta=0,
					minValue=this._snapshot[name][1],
					unit=this._snapshot[name][0]
				for(var i=0; i<property.length; i++){
					var maxDelta,maxValue
					for(maxDelta in property[i]){
						maxValue=property[i][maxDelta][1]
					}
					if(minDelta<=delta && delta<=maxDelta){
						var coef=(delta-minDelta)/(maxDelta-minDelta)
						if(minValue instanceof Array){
							var value=[]
							for(var i=0; i<minValue.length; i++){
								value[i]=Math.round(minValue[i]+(maxValue[i]-minValue[i])*coef)
							}
						}else{
							var value=minValue+(maxValue-minValue)*coef
							if(unit=='px')value=Math.round(value)
						}
						this.element.css(name,this.make([unit,value]))
						break
					}
					minDelta=maxDelta
					minValue=maxValue
				}
			}
			if(typeof(this._options.after)=='function')this._options.after.call(this.element,event)
			if(this._options.triggerEvents==true)this.element.trigger('magnifyafter',{event:event})
		},
		disable:function(){
			$('body').unbind('mousemove',this.render)
		},
		enable:function(){
			$('body').bind('mousemove',$.proxy(this.render,this))
		},
		destroy:function(){
			this.disable()
			this.element.removeData('magnify')
		},
		distanceTo:{
			center:function(mousePosition,elementPosition,elementDimentions){
				var x=this._options.axis.indexOf('x')==-1?
					0:mousePosition[0]-(elementPosition[0]+elementDimentions[0]/2)
				var y=this._options.axis.indexOf('y')==-1?
					0:mousePosition[1]-(elementPosition[1]+elementDimentions[1]/2)
				return Math.round(Math.sqrt(Math.pow(x,2)+Math.pow(y,2)))
			},
			closest:function(mousePosition,elementPosition,elementDimentions){
				if(this._options.axis.indexOf('x')==-1){
					var x=0
				}else{
					var x=0,x1=mousePosition[0],x2=elementPosition[0],x3=x2+elementDimentions[0]
					if(x1<x2)x=x2-x1
					else if(x3<x1)x=x1-x3
				}

				if(this._options.axis.indexOf('y')==-1){
					var y=0
				}else{
					var y=0,y1=mousePosition[1],y2=elementPosition[1],y3=y2+elementDimentions[1]
					if(y1<y2)y=y2-y1
					else if(y3<y1)y=y1-y3
				}

				return Math.round(Math.sqrt(Math.pow(x,2)+Math.pow(y,2)))
			}
		},
		delta:{
			linear:function(distance){return distance/this._options.distance},
			sin:function(distance){return Math.sin(2*Math.PI*distance/this._options.distance)},
			cos:function(distance){return Math.cos(2*Math.PI*distance/this._options.distance)}
		},
		trim:function(string){
			var start=0,end=string.length
			while(this.whitespaceChar.indexOf(string.charAt(start))>-1 && start<end)start++
			while(this.whitespaceChar.indexOf(string.charAt(end))>-1 && start<end)end--
			return string.slice(start,end+1)
		},
		parse:function(string){
			if(typeof(string)!='string')return [null,string]
			string=this.trim(string)
			switch(true){
				case string.charAt(0)=="#":
					var Int=parseInt(string.slice(1),16),
						value=[]
					if(string.length<=5){
						var off=string.length-1
						for(var i=off-1; i>-1; i--)value.push((Int>>(4*i)&0xF)|((Int>>(4*i)&0xF)<<4))
					}else{
						var off=(string.length-1)/2
						for(var i=off-1; i>-1; i--)value.push(Int>>(8*i)&0xFF)
					}
					if(value.length==3){
						var unit='rgb'
					}else{
						var unit='rgba'
						value[3]=parseFloat((value[3]/0xFF).toPrecision(2))
					}
				return [unit,value]
				case string.indexOf("rgb(") === 0 || string.indexOf("rgba(") === 0:
					var open=string.indexOf('('),
						close=string.indexOf(')'),
						value=string.slice(open+1,close).split(','),
						unit=value.length==3?'rgb':'rgba'
					for(var i=0; i<value.length; i++)value[i]=parseFloat(value[i])
				return [unit,value]
				default:
					var value=parseFloat(string)
					var start=string.length-1
					while(this.numberChar.indexOf(string.charAt(start))===-1 && start>0)start--
					var unit=string.slice(start+1)
					if(unit==='')unit=null
				return [unit,value]
			}
		},
		make:function(value){
			switch(value[0]){
				case 'rgb':
				case 'rgba':
					return value[0]+'('+value[1].join(',')+')'
				case null:
					return value[1]
				default:
					return value[1]+value[0]
			}
		}
	}
})(jQuery);