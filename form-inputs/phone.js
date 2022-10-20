import FormInput from './base';
import IMask from 'imask';

/**
 * Компонент элемента ввода телефона
 * @param {Element} $element HTML элемент
 * @param {Object}  options
 */
function FormInputPhone($element, options = {}) {
    // наследование
    FormInput.call(this, $element, options);

    this.mask = IMask(this.$element, {
        mask: [
            {
                mask: '+{7} (000) 000-00-00',
                startsWith: '7',
                country: 'Russia',
                default: true,
            },
            {
                mask: '+{375} (00) 000-00-00',
                startsWith: '375',
                country: 'Belarus',
            },
        ],
        dispatch: (appended, dynamicMasked) => {
            const number = (dynamicMasked.value + appended).replace(/\D/g,'');

            let result = dynamicMasked.compiledMasks.find(m => {
                return number.indexOf(m.startsWith) === 0 || m.startsWith.indexOf(number) === 0;
            });

            if (!result) {
                result = dynamicMasked.compiledMasks[0];
            }

            return result;
        },
    });
}

// цепочка прототипов
FormInputPhone.prototype = Object.create(FormInput.prototype);
Object.defineProperty(FormInputPhone.prototype, 'constructor', {
    value: FormInputPhone,
    writable: true,
    enumerable: false,
});

FormInputPhone.prototype.validate = function() {
    return this.mask.masked.isComplete;
}

FormInputPhone.prototype.getValue = function() {
    return this.mask.value;
}

FormInputPhone.prototype.setValue = function(value) {
    return this.mask.unmaskedValue = value.replace(/[^0-9]/g, '');
}

export default FormInputPhone;
