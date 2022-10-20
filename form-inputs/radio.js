import FormInput from './base';

/**
 * Группа радио кнопок
 * @param {Element} $element HTML элемент
 * @param {Object}  options
 */
function FormInputRadio($element, options = {}) {
    // наследование
    FormInput.call(this, $element, options);

    Object.defineProperty(this, 'checked', {
        get: this.getChecked.bind(this),
        set: this.setChecked.bind(this),
    });

    Object.defineProperty(this, 'value', {
        get: this.getValue.bind(this),
        set: this.setValue.bind(this),
    });

    this.$radio = this.$element.querySelector('input[type="radio"]');

    this.$element.addEventListener('change', this._onChangeEvent.bind(this));
    this._onChangeEvent();
}

// цепочка прототипов
FormInputRadio.prototype = Object.create(FormInput.prototype);
Object.defineProperty(FormInputRadio.prototype, 'constructor', {
    value: FormInputRadio,
    writable: true,
    enumerable: false,
});

FormInputRadio.prototype.getChecked = function() {
    return this.$element.checked;
}

FormInputRadio.prototype.setChecked = function(value) {
    value = !!value;

    if (this.$element.checked != value) {
        this.$element.checked = value;
        this._onChangeEvent();
    }
}

FormInputRadio.prototype.getValue = function() {
    return this.$element.value;
}

FormInputRadio.prototype.setValue = function(value) {
    this.$element.value = value;
}

FormInputRadio.prototype._onChangeEvent = function() {
    this.emit('check', this.$element.checked);
}

FormInputRadio.prototype.getName = function() {
    return (this.$radio || this.$element).name;
}

export default FormInputRadio;
