import { GUI } from '../node_modules/lil-gui/dist/lil-gui.esm.js'

export class DebugUI
{
    constructor(container, title) 
    { 
        this._gui = new GUI({ autoPlace: false, container: container })
        this._gui.title(title)
        this._groups = new Map()
        this._elements = new Map()
        this._values = new Map()
    }

    addSlider(groupName, paramName, defaultValue, min, max, callbackFunc)
    {
        let object = this._createObject(paramName, defaultValue)
        let prevValue = defaultValue
        let sliderCallback = v => 
        {
            callbackFunc(v, v - prevValue)
            prevValue = v
        }
        let callback = this._prepareCallback(groupName, paramName, defaultValue, sliderCallback)
        let func = group => this._elements.set(groupName+'/'+paramName, group.add(object, paramName, min, max).onChange(callback))
        this._addToGroup(groupName, func)
    }

    addColor(groupName, paramName, defaultValue, callbackFunc)
    {
        let object = this._createObject(paramName, defaultValue)
        let parser = v => { return JSON.stringify({r: v.r, g: v.g, b: v.b}) }
        let callback = this._prepareCallback(groupName, paramName, defaultValue, callbackFunc, parser)
        let func = group => this._elements.set(groupName+'/'+paramName, group.addColor(object, paramName).onChange(callback))
        this._addToGroup(groupName, func)
    }

    addCheckBox(groupName, paramName, defaultValue, callbackFunc)
    {
        let object = this._createObject(paramName, defaultValue)
        let callback = this._prepareCallback(groupName, paramName, defaultValue, callbackFunc)
        let func = group => this._elements.set(groupName+'/'+paramName, group.add(object, paramName).onChange(callback))
        this._addToGroup(groupName, func)
    }

    addButton(groupName, paramName, callbackFunc)
    {
        let object = this._createObject(paramName, ()=>{})
        let callback = this._prepareCallback(groupName, paramName, '', callbackFunc)
        let func = group => this._elements.set(groupName+'/'+paramName, group.add(object, paramName).onChange(callback))
        this._addToGroup(groupName, func)
    }

    addDropDown(groupName, paramName, values, callbackFunc, defaultValue)
    {
        if (defaultValue == undefined)
            defaultValue = values[0]
        let object = this._createObject(paramName, defaultValue)
        let callback = this._prepareCallback(groupName, paramName, defaultValue, callbackFunc)
        let func = group => this._elements.set(groupName+'/'+paramName, group.add(object, paramName, values).onChange(callback))
        this._addToGroup(groupName, func)
    }

    addExportButton(groupName, paramName, callbackFunc) 
    { 
        let object = this._createObject(paramName, ()=>{})
        let func = group => this._elements.set(groupName+'/'+paramName, group.add(object, paramName).onChange(() => callbackFunc(this._toJson())))
        this._addToGroup(groupName, func)
    }

    show() { this._gui.open() }

    close() { this._gui.close() }

    hide() { this._gui.hide() }

    showGroup(groupName)
    {
        let group = this._groups.get(groupName)
        if (group != undefined)
            group.show()
    }

    hideGroup(groupName)
    {
        let group = this._groups.get(groupName)
        if (group != undefined)
            group.hide()
    }

    showElement(groupName, paramName)
    {
        let element = this._elements.get(groupName+'/'+paramName)
        if (element != undefined)
            element.show()
    }

    hideElement(groupName, paramName)
    {
        let element = this._elements.get(groupName+'/'+paramName)
        if (element != undefined)
            element.hide()
    }

    setElementValue(groupName, paramName, value)
    {
        let element = this._elements.get(groupName+'/'+paramName)
        if (element != undefined)
            element.setValue(value)
    }

    getElementValue(groupName, paramName)
    {
        let element = this._elements.get(groupName+'/'+paramName)
        if (element != undefined)
            return element.getValue()
    }

    _createObject(paramName, value)
    {
        let objectJson = '{"'+paramName+'" : null'+'}'
        let object = JSON.parse(objectJson)
        object[paramName] = value
        return object
    }

    _prepareCallback(groupName, paramName, value, callbackFunc, parser)
    {
        if (parser == undefined)
            parser = v => { return JSON.stringify(v) }
        let key = (groupName != '') ? groupName+'/'+paramName : paramName
        this._values.set(key, parser(value))
        let callback = v => 
        {
            this._values.set(key, parser(v))
            callbackFunc(v)
        }
        return callback
    }

    _addToGroup(groupName, func)
    {
        let group = (groupName == '') ? this._gui : this._groups.get(groupName)
        if (group == undefined)
        {
            group = this._gui.addFolder(groupName)
            group.open()
            this._groups.set(groupName, group)
        }
        func(group)
    }

    _toJson()
    {
        let json = '{\n'
        let keys = Array.from(this._values.keys())
        for (let key of keys)
        {
            json = json.concat('\t' + key + ' : ' + this._values.get(key))
            if (keys.indexOf(key) != (keys.length - 1))
                json = json.concat(',\n') 
        }
        json = json.concat('\n}')
        return json
    }
}