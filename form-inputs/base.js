import ComponentElement from '@neomasterr/component-element';
import {createElement, getTransitionDuration} from '@neomasterr/utils';

/**
 * Компонент элемента ввода
 *
 * Предоставляет метод setError() для отображения инлайн ошибки
 * Предоставляет метод resetError() для скрытия ошибки
 *
 * @param {Element} $element HTML элемент
 * @param {Object}  options
 */
function FormInput($element, options = {}) {
    // наследование
    ComponentElement.call(this, $element, options);

    Object.defineProperty(this, 'disabled', {
        get: this.getDisabled.bind(this),
        set: this.setDisabled.bind(this),
    });

    Object.defineProperty(this, 'value', {
        get: this.getValue.bind(this),
        set: this.setValue.bind(this),
        enumerable: true,
    });
}

// цепочка прототипов
FormInput.prototype = Object.create(ComponentElement.prototype);
Object.defineProperty(FormInput.prototype, 'constructor', {
    value: FormInput,
    writable: true,
    enumerable: false,
});

/**
 * Вывод ошибки
 * @param  {String}  text Текст ошибки
 * @return {Promise} Промис по завершению анимации
 */
FormInput.prototype.setError = function(text) {
    this.$element.classList.add('is-error');

    return this.resetErrorMessage().then(() => {
        this.setErrorMessage(text);
    });
}

/**
 * Вывод сообщения ошибки
 * @return {Promise} Промис по завершению анимации
 */
FormInput.prototype.setErrorMessage = function(text) {
    return new Promise(resolve => {
        if (!this.$error) {
            this.$error = createElement(`<span class="Form__input-error"></span>`);
            this.$element.insertAdjacentElement('afterend', this.$error);
        }

        if (text.length) {
            this.$error.textContent = text;
            if (this.$error.classList.contains('is-active')) {
                resolve();
                return;
            }

            // для плавной анимации
            window.requestAnimationFrame(() => {
                this.$error.classList.add('is-active');
                resolve();
            });
        }
    });
}

/**
 * Сброс ошибки
 * @return {Promise} Промис по завершению анимации
 */
FormInput.prototype.resetError = function() {
    this.$element.classList.remove('is-error');
    return this.resetErrorMessage();
}

/**
 * Сброс сообщения ошибки
 * @return {Promise} Промис по завершению анимации
 */
FormInput.prototype.resetErrorMessage = function() {
    if (!this.$error) {
        return Promise.resolve();
    }

    return new Promise(resolve => {
        this.$error.classList.remove('is-active');

        setTimeout(() => {
            resolve();
        }, getTransitionDuration(this.$error));
    });
}

/**
 * Имя элемента
 * @return {String}
 */
FormInput.prototype.getName = function() {
    return this.$element.name;
}

/**
 * Валидация
 * @return {Boolean} true если данные корректны
 */
FormInput.prototype.validate = function() {
    if (this.$element.required && !this.$element.value.trim().length) {
        return false;
    }

    return true;
}

/**
 * Отключенное состояние
 * @return {Boolean} true если элемент отключен
 */
FormInput.prototype.getDisabled = function() {
    return this.$element.disabled;
}

/**
 * Включение / отключение элемента
 * @param {Boolean} disabled true для отключения
 */
FormInput.prototype.setDisabled = function(disabled) {
    this.setState('disabled', disabled);
    this.$element.disabled = disabled;
    return disabled;
}

/**
 * Значение элемента
 * @return {String}
 */
FormInput.prototype.getValue = function() {
    return this.$element.value;
}

/**
 * Установка значения элемента
 * @param {String} value
 */
FormInput.prototype.setValue = function(value) {
    return this.$element.value = value;
}

export default FormInput;
