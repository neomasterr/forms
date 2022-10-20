import FormInput from './base';

/**
 * Компонент элемента ввода текста
 * @param {Element} $element HTML элемент
 * @param {Object}  options
 */
function FormInputText($element, options = {}) {
    // наследование
    FormInput.call(this, $element, options);
}

// цепочка прототипов
FormInputText.prototype = Object.create(FormInput.prototype);
Object.defineProperty(FormInputText.prototype, 'constructor', {
    value: FormInputText,
    writable: true,
    enumerable: false,
});

export default FormInputText;
