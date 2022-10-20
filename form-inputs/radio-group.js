import FormInput from './base';
import FormInputRadio from './radio';

/**
 * Группа радио кнопок
 * @param {Element} $element HTML элемент
 * @param {Object}  options
 */
function FormInputRadioGroup($element, options = {}) {
    // наследование
    FormInput.call(this, $element, options);

    Object.defineProperty(this, 'value', {
        get: this.getValue.bind(this),
        set: this.setValue.bind(this),
    });

    this._radio = [];
    this.$element.querySelectorAll(`input[type="radio"][name="${this.$element.dataset.name}"]`).forEach($radio => {
        this._radio.push(new FormInputRadio($radio));
    });

    this._radio.forEach(radio => {
        radio.on('check', this._onRadioCheck.bind(this, radio));
    });

    // инициализация
    const radioChecked = this.getChecked();
    radioChecked && this._onRadioCheck(radioChecked, true);
}

// цепочка прототипов
FormInputRadioGroup.prototype = Object.create(FormInput.prototype);
Object.defineProperty(FormInputRadioGroup.prototype, 'constructor', {
    value: FormInputRadioGroup,
    writable: true,
    enumerable: false,
});

/**
 * Активная кнопка
 * @return {FormInputRadio}
 */
FormInputRadioGroup.prototype.getChecked = function() {
    for (let i = 0; i < this._radio.length; ++i) {
        const radio = this._radio[i];
        if (radio.checked) {
            return radio;
        }
    }
}

/**
 * Value активной кнопки
 * @return {String}
 */
FormInputRadioGroup.prototype.getValue = function() {
    try {
        return this.getChecked().value;
    } catch (e) {
        return undefined;
    }
}

/**
 * Активация кнопки с определённым значением value
 * @param {String|Number} value Значение, используемое для поиска кнопки
 */
FormInputRadioGroup.prototype.setValue = function(value) {
    for (let i = 0; i < this._radio.length; ++i) {
        const radio = this._radio[i];
        if (radio.value == value) {
            radio.checked = true;
            return true;
        }
    }

    return false;
}

/**
 * Событие активации кнопки
 * @param  {FormInputRadio} radio Экземпляр объекта радио кнопки
 * @param  {Boolean}        check Состояние активации
 */
FormInputRadioGroup.prototype._onRadioCheck = function(radio, check) {
    this.emit('check', radio.value);
}

FormInputRadioGroup.prototype.getName = function() {
    return this.options.name || this.$element.dataset.name;
}

export default FormInputRadioGroup;
